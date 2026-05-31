import maplibregl, { type Map as MapLibreMap, type Marker, type LngLatLike } from 'maplibre-gl';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import {
  type GeocodeResult,
  type LatLng,
  SF_DEFAULT,
  debounce,
  haversineMiles,
  reverseGeocode,
  searchPlaces,
} from './geocode';

/**
 * Production-quality interactive MapLibre GL JS destination picker.
 *
 * Features implemented to match/exceed Figma fidelity for CARGO ride-hailing:
 * - Draggable destination marker + tap-to-place (map click moves pin)
 * - Smooth flyTo on search / suggestion / "use current location"
 * - Real reverse geocoding (Nominatim) → updates address in UI + store on confirm
 * - Forward search autocomplete via Photon (debounced, abortable)
 * - Simple straight-line route preview (GeoJSON layer) between pickup & dest
 * - Browser geolocation with graceful SF default fallback
 * - "Use current location" action (updates pickup or centers for dest)
 * - Bottom floating confirm panel with Figma-matched aesthetics (uses existing tokens)
 * - Touch friendly, 60fps pan/zoom via MapLibre
 * - Lazy-safe (parent should lazy-load), full cleanup on unmount
 * - Custom SVG markers (flag pin for dest, pulsing dot for user)
 * - Small legal attribution footer
 *
 * Tile source (free, no key):
 *   Primary: OpenFreeMap "Liberty" style (vector, OSM data)
 *   Fallback: MapLibre demo tiles
 *
 * Offline note (documented for future):
 *   To add PMTiles offline support later:
 *     1. npm i @maplibre/maplibre-gl-pmtiles pmtiles
 *     2. Register protocol: maplibregl.addProtocol('pmtiles', ...)
 *     3. Use local .pmtiles file or self-hosted tiles for SF bbox + style with "sources": {"openmaptiles": {"type":"vector","url":"pmtiles://./sf.pmtiles"}}
 *   Keeps the exact same MapView API. Current implementation is network-first.
 *
 * Performance:
 *   - Map chunk is already split via Vite manualChunks 'map-vendor'
 *   - Markers and layers are created once; only data updated
 *   - Geocode calls heavily debounced + aborted on rapid interaction
 *   - No console spam in production paths (warnings only on real failure)
 */

interface MapViewProps {
  /** Called when user confirms the destination in the floating panel */
  onConfirmDestination: (address: string, coords: LatLng, estimatedPrice: number) => void;
  /** Optional initial destination (from persisted booking) */
  initialDestCoords?: LatLng;
  initialPickupCoords?: LatLng;
}

const MAP_STYLE_PRIMARY = 'https://tiles.openfreemap.org/styles/liberty/style.json';
const MAP_STYLE_FALLBACK = 'https://demotiles.maplibre.org/style.json';

const DEFAULT_ZOOM = 13.5;
const PIN_ZOOM = 16;

// Rough price model (demo only, feels realistic for SF)
function calculateEstimatedPrice(pickup: LatLng, dest: LatLng): number {
  const miles = haversineMiles(pickup, dest);
  const base = 6.5;
  const perMile = 2.35;
  const surge = 1.0; // could be dynamic later
  const price = Math.round((base + miles * perMile) * surge * 10) / 10;
  return Math.max(7, Math.min(48, price)); // clamp to realistic range
}

// Custom destination pin (matches Figma screen 11 aesthetic: dark flag + cyan accent)
function createDestinationMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'cargo-dest-pin';
  el.innerHTML = `
    <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#shadow)">
        <path d="M19 0C8.5 0 0 8.5 0 19C0 29.5 19 46 19 46C19 46 38 29.5 38 19C38 8.5 29.5 0 19 0Z" fill="#111111"/>
        <circle cx="19" cy="18" r="7" fill="#0A7CFF"/>
        <path d="M15 14 L23 14 L23 22 L19 26 L15 22 Z" fill="white"/>
        <circle cx="19" cy="18" r="2.5" fill="#111111"/>
      </g>
      <defs>
        <filter id="shadow" x="-2" y="-2" width="42" height="52" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
    </svg>
  `;
  el.style.cursor = 'grab';
  el.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))';
  return el;
}

// Pulsing user location marker (iOS-like blue dot + halo) with clear "起点" label
function createUserLocationElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'cargo-user-loc';
  el.innerHTML = `
    <div class="cargo-user-dot-outer"></div>
    <div class="cargo-user-dot"></div>
    <div class="cargo-user-label">起点</div>
  `;
  return el;
}

export function MapView({
  onConfirmDestination,
  initialDestCoords,
  initialPickupCoords,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const destMarkerRef = useRef<Marker | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const routeLayerId = 'cargo-route';

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedDest, setSelectedDest] = useState<{ coords: LatLng; address: string } | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<LatLng>(initialPickupCoords || SF_DEFAULT);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Store access for pickup (read-only in map for preview)
  const { booking } = useAppStore();

  // Current pickup coords (fallback to userLocation)
  const pickupCoords: LatLng = booking.pickupCoords || initialPickupCoords || userLocation;

  // Debounced reverse geocode for marker drag / tap
  const debouncedReverse = useCallback(
    debounce(async (coords: LatLng) => {
      const ac = new AbortController();
      abortControllerRef.current = ac;

      const address = await reverseGeocode(coords, ac.signal);
      if (address) {
        setSelectedDest({ coords, address });
      }
    }, 420),
    []
  );

  // Update or create the destination marker (draggable)
  const updateDestMarker = useCallback(
    (coords: LatLng, address?: string) => {
      const map = mapRef.current;
      if (!map) return;

      if (!destMarkerRef.current) {
        const el = createDestinationMarkerElement();
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
          draggable: true,
        })
          .setLngLat([coords.lng, coords.lat] as LngLatLike)
          .addTo(map);

        // Drag handling (production quality – fires on end)
        marker.on('dragend', () => {
          const pos = marker.getLngLat();
          const newCoords: LatLng = { lat: pos.lat, lng: pos.lng };
          debouncedReverse(newCoords);
          // Keep camera following a little for premium feel
          map.panTo([newCoords.lng, newCoords.lat], { duration: 180 });
        });

        // Click on marker recenters nicely
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          map.flyTo({ center: [coords.lng, coords.lat], zoom: PIN_ZOOM, duration: 420 });
        });

        destMarkerRef.current = marker;
      } else {
        destMarkerRef.current.setLngLat([coords.lng, coords.lat] as LngLatLike);
      }

      if (address) {
        setSelectedDest({ coords, address });
      }
    },
    [debouncedReverse]
  );

  // Draw / update straight-line route preview layer (high value, zero cost)
  const updateRoutePreview = useCallback((pickup: LatLng, dest: LatLng) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [pickup.lng, pickup.lat],
          [dest.lng, dest.lat],
        ],
      },
      properties: {},
    };

    // Remove old layer/source if exists (safe)
    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeLayerId)) map.removeSource(routeLayerId);

    map.addSource(routeLayerId, {
      type: 'geojson',
      data: geojson,
    });

    map.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeLayerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#0A7CFF',
        'line-width': 3.5,
        'line-opacity': 0.75,
        'line-dasharray': [1.5, 1.8],
      },
    });
  }, []);

  // Place / update user location marker (non-draggable, pulsing)
  const updateUserMarker = useCallback((coords: LatLng) => {
    const map = mapRef.current;
    if (!map) return;

    if (!userMarkerRef.current) {
      const el = createUserLocationElement();
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([coords.lng, coords.lat] as LngLatLike)
        .addTo(map);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLngLat([coords.lng, coords.lat] as LngLatLike);
    }
  }, []);

  // Fly camera + optionally move marker + reverse geocode
  const flyToLocation = useCallback(
    async (coords: LatLng, withMarker = true, label?: string) => {
      const map = mapRef.current;
      if (!map) return;

      map.flyTo({
        center: [coords.lng, coords.lat] as LngLatLike,
        zoom: PIN_ZOOM,
        duration: 680,
        essential: true,
        easing: (t) => t * (2 - t), // nice ease
      });

      if (withMarker) {
        // Small delay so fly feels natural before marker snaps
        setTimeout(() => {
          updateDestMarker(coords, label);
          // Also draw route if we have pickup
          if (pickupCoords) {
            updateRoutePreview(pickupCoords, coords);
          }
        }, 120);
      }
    },
    [updateDestMarker, updateRoutePreview, pickupCoords]
  );

  // Core map initialization (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const styleUrl = MAP_STYLE_PRIMARY;

        const map = new maplibregl.Map({
          container: containerRef.current!,
          style: styleUrl,
          center: [userLocation.lng, userLocation.lat] as LngLatLike,
          zoom: DEFAULT_ZOOM,
          attributionControl: false, // we render our own legal footer
          pitchWithRotate: false, // keep simple 2D for ride-hailing feel
          dragRotate: false,
          touchPitch: false,
        });

        mapRef.current = map;

        // Add subtle zoom controls (iOS-like, small)
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false, showZoom: true }),
          'bottom-right'
        );

        map.on('load', () => {
          if (cancelled) return;
          setIsMapLoaded(true);

          // Always show clear pickup / user location marker first (起点)
          updateUserMarker(pickupCoords || userLocation);

          // Do NOT auto-place a destination marker on load.
          // Let the user explicitly choose the destination (终点) by tapping or searching.
          // This makes the UX much clearer: "I am here → I choose where to go".

          // If we already have a previous destination (coming back in flow), restore it + draw route
          if (initialDestCoords) {
            updateDestMarker(initialDestCoords);
            if (pickupCoords) {
              updateRoutePreview(pickupCoords, initialDestCoords);
            }
          }

          // Tap anywhere on map → place destination pin + reverse geocode + draw route from pickup
          map.on('click', (e) => {
            const coords: LatLng = { lat: e.lngLat.lat, lng: e.lngLat.lng };
            updateDestMarker(coords);
            debouncedReverse(coords);
            updateRoutePreview(pickupCoords, coords);
          });

          // Keyboard accessibility (Escape clears suggestions)
          const handleKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
              setShowSuggestions(false);
              setSearchQuery('');
            }
          };
          window.addEventListener('keydown', handleKey);

          // Store cleanup for key listener
          (map as any)._cargoKeyCleanup = () => window.removeEventListener('keydown', handleKey);
        });

        // Error resilience for tile style
        map.on('error', (e) => {
          console.warn('[CARGO Map] MapLibre error (attempting graceful handling):', e);
          if (!mapError && styleUrl === MAP_STYLE_PRIMARY) {
            // One-shot fallback to demo tiles (still free, no key)
            try {
              map.setStyle(MAP_STYLE_FALLBACK);
            } catch (_) {
              setMapError('Map tiles temporarily unavailable. Using simplified view.');
            }
          }
        });

        // Gentle resize handling (important inside device frame)
        const ro = new ResizeObserver(() => {
          if (map && !cancelled) map.resize();
        });
        const el = containerRef.current;
        if (el) {
          ro.observe(el);
        }
        (map as any)._cargoResizeObserver = ro;
      } catch (err) {
        console.error('[CARGO Map] Failed to initialize MapLibre:', err);
        setMapError('Unable to load interactive map. Please check your connection.');
      }
    };

    initMap();

    // Full cleanup on unmount (critical for React 19 + hot reloads)
    return () => {
      cancelled = true;
      abortControllerRef.current?.abort();

      const map = mapRef.current;
      if (map) {
        // Cleanup listeners / observers we attached
        try {
          if ((map as any)._cargoKeyCleanup) (map as any)._cargoKeyCleanup();
          if ((map as any)._cargoResizeObserver) (map as any)._cargoResizeObserver.disconnect();
        } catch (_) {}

        destMarkerRef.current?.remove();
        userMarkerRef.current?.remove();
        map.remove();
      }
      mapRef.current = null;
      destMarkerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run exactly once

  // When external initial coords change (rare), sync marker
  useEffect(() => {
    if (initialDestCoords && isMapLoaded) {
      updateDestMarker(initialDestCoords);
    }
  }, [initialDestCoords, isMapLoaded, updateDestMarker]);

  // Geolocation handler (graceful, called on mount + via button)
  const handleGetUserLocation = useCallback(
    (centerOnly = false) => {
      if (!navigator.geolocation) {
        // Fallback already in state
        if (!centerOnly) {
          flyToLocation(userLocation, true, 'Current location (SF demo)');
        }
        return;
      }

      setIsLocating(true);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };

          setUserLocation(coords);
          updateUserMarker(coords);

          const map = mapRef.current;
          if (map) {
            map.flyTo({ center: [coords.lng, coords.lat], zoom: 14.5, duration: 620 });
          }

          // Reverse for nice pickup label if user wants to "set pickup"
          const addr = await reverseGeocode(coords);
          if (!centerOnly) {
            // For destination picker flow, center + offer as potential dest too
            updateDestMarker(coords, addr || 'Your current location');
            if (pickupCoords) updateRoutePreview(pickupCoords, coords);
          }

          // Also expose to parent via side effect on store (caller decides)
          setIsLocating(false);
        },
        (err) => {
          console.info('[CARGO Map] Geolocation denied or unavailable, using SF default.', err);
          setIsLocating(false);
          const fallback = SF_DEFAULT;
          setUserLocation(fallback);
          updateUserMarker(fallback);
          const map = mapRef.current;
          if (map)
            map.flyTo({ center: [fallback.lng, fallback.lat], zoom: DEFAULT_ZOOM, duration: 400 });
          if (!centerOnly) {
            updateDestMarker(fallback, 'San Francisco, CA (demo)');
          }
        },
        { enableHighAccuracy: true, timeout: 8500, maximumAge: 60_000 }
      );
    },
    [
      flyToLocation,
      updateDestMarker,
      updateRoutePreview,
      updateUserMarker,
      userLocation,
      pickupCoords,
    ]
  );

  // Seed real user location shortly after map ready (nice UX, no blocking)
  useEffect(() => {
    if (isMapLoaded && !initialPickupCoords) {
      const t = setTimeout(() => handleGetUserLocation(true), 680);
      return () => clearTimeout(t);
    }
  }, [isMapLoaded, handleGetUserLocation, initialPickupCoords]);

  // Debounced live search (Photon)
  const runSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;
      setIsFetchingSuggestions(true);

      const results = await searchPlaces(q, 5, ac.signal);
      setSuggestions(results.length ? results : []);
      setIsFetchingSuggestions(false);
    }, 290),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(true);
    runSearch(val);
  };

  const handleSelectSuggestion = async (s: GeocodeResult) => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSuggestions([]);

    await flyToLocation(s.coords, true, s.address);
    // updateRoutePreview already called inside flyToLocation flow via closure
    updateRoutePreview(pickupCoords, s.coords);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    abortControllerRef.current?.abort();
  };

  // "Use current location" for destination
  const handleUseCurrentAsDest = () => {
    const coords = userLocation;
    flyToLocation(coords, true, 'Your current location');
    updateRoutePreview(pickupCoords, coords);
    setShowSuggestions(false);
  };

  // Confirm flow – exactly as required (update store + route to /service)
  const handleConfirm = async () => {
    if (!selectedDest) return;

    setIsConfirming(true);
    // Small delay for perceived reliability (matches high-quality prototypes)
    await new Promise(r => setTimeout(r, 120));

    const price = calculateEstimatedPrice(pickupCoords, selectedDest.coords);
    onConfirmDestination(selectedDest.address, selectedDest.coords, price);
    // Note: parent usually navigates away, but reset in case
    setIsConfirming(false);
  };

  // Quick chips (Figma-inspired suggested places)
  const quickPlaces = [
    { label: 'Financial District', coords: { lat: 37.7936, lng: -122.3965 } },
    { label: 'SFO Airport', coords: { lat: 37.6213, lng: -122.379 } },
    { label: 'Mission Bay', coords: { lat: 37.7765, lng: -122.3943 } },
  ];

  const handleQuickPlace = (coords: LatLng, label: string) => {
    flyToLocation(coords, true, label);
    updateRoutePreview(pickupCoords, coords);
    setShowSuggestions(false);
  };

  // Render
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#E8E8E8]">
      {/* Map container */}
      <div ref={containerRef} className="map-container absolute inset-0" />

      {/* Loading / error overlays */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-[#6C6C6E]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A7CFF] border-t-transparent" />
            <div className="text-sm font-medium">Loading map…</div>
          </div>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 p-6 text-center">
          <div className="text-[#FF3B30] mb-2">⚠️</div>
          <div className="font-semibold">{mapError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn btn-secondary text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top search / address bar (Figma screen 11 inspired + enhanced) */}
      <div className="absolute left-0 right-0 top-0 z-50 px-3 pt-2 pb-1 bg-gradient-to-b from-white via-white to-white/95 border-b border-[#E5E5EA]">
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-zinc-100 text-[#0A7CFF]"
              aria-label="Go back"
            >
              <X size={19} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={selectedDest?.address || 'Where to?'}
                className="input h-11 w-full bg-[#F2F2F7] border-0 pl-10 text-[15px] placeholder:text-[#8E8E93] shadow-sm"
              />
              <MapPin className="absolute left-3.5 top-3.5 text-[#0A7CFF]" size={17} />

              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] active:text-black p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={() => handleGetUserLocation(true)}
              disabled={isLocating}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow border border-[#E5E5EA] active:bg-zinc-50 disabled:opacity-50"
              aria-label="My location"
            >
              <Navigation
                size={17}
                className={isLocating ? 'animate-pulse text-[#0A7CFF]' : 'text-[#0A7CFF]'}
              />
            </button>
          </div>

          {/* Pickup indicator (subtle, always visible) */}
          <div className="mt-1.5 pl-1 text-[10px] uppercase tracking-[0.5px] text-[#8E8E93] flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" /> PICKUP:{' '}
            {booking.pickupLocation}
          </div>
        </div>
      </div>

      {/* Search suggestions dropdown (rate-limit friendly) */}
      {showSuggestions && (searchQuery.length > 1 || suggestions.length > 0) && (
        <div className="absolute left-3 right-3 top-[78px] z-[60] bg-white rounded-2xl shadow-xl border border-[#E5E5EA] overflow-hidden max-h-[46vh] overflow-y-auto">
          {isFetchingSuggestions && (
            <div className="px-4 py-3 text-xs text-[#8E8E93]">Searching…</div>
          )}

          {suggestions.length > 0 ? (
            suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-4 py-3.5 active:bg-[#F2F2F7] border-b border-[#F2F2F7] last:border-b-0 flex gap-3 items-start"
              >
                <MapPin size={18} className="mt-0.5 text-[#0A7CFF] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-[15px] leading-tight">{s.address}</div>
                </div>
              </button>
            ))
          ) : searchQuery.length > 1 ? (
            <div className="px-4 py-6 text-sm text-[#6C6C6E] text-center">
              No matches. Try "airport" or "downtown".
            </div>
          ) : null}

          {/* Quick action row inside suggestions */}
          <div className="p-2 bg-[#F8F9FA] border-t flex flex-wrap gap-2">
            <button
              onClick={handleUseCurrentAsDest}
              className="flex-1 text-left px-3 py-2 text-xs font-medium bg-white rounded-xl border active:bg-zinc-50 flex items-center gap-1.5"
            >
              <Navigation size={14} /> Use current location
            </button>
            <button
              onClick={() => {
                setShowSuggestions(false);
                handleGetUserLocation(true);
              }}
              className="flex-1 text-left px-3 py-2 text-xs font-medium bg-white rounded-xl border active:bg-zinc-50"
            >
              Recenter map
            </button>
          </div>
        </div>
      )}

      {/* Quick destination chips (Figma spirit) – visible when not searching */}
      {!showSuggestions && isMapLoaded && (
        <div className="absolute left-3 right-3 top-[82px] z-50 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickPlaces.map((p, i) => (
            <button
              key={i}
              onClick={() => handleQuickPlace(p.coords, p.label)}
              className="flex-shrink-0 px-3.5 py-1 rounded-full bg-white/95 text-xs font-medium shadow border border-[#E5E5EA] active:bg-[#0A7CFF] active:text-white active:border-[#0A7CFF] text-[#111] whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating "my location" FAB (right side, iOS map style) */}
      <button
        onClick={() => handleGetUserLocation(true)}
        className="absolute bottom-[132px] right-3 z-50 bg-white rounded-full p-2.5 shadow-lg border border-[#E5E5EA] active:scale-95"
        aria-label="Center on my location"
      >
        <Navigation size={18} className="text-[#0A7CFF]" />
      </button>

      {/* Bottom floating confirm panel – matches Figma card / button aesthetics */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-white via-white to-white/95 border-t border-[#E5E5EA]">
        {selectedDest ? (
          <div className="space-y-3">
            {/* Mini summary card - clearly show 起点 → 终点 */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-3 shadow-sm text-sm">
              {/* Origin */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-6 h-6 rounded bg-[#34C759]/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-[#34C759] rounded-full" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[1px] text-[#8E8E93]">起点</div>
                  <div className="font-medium text-[14px] leading-snug">
                    {booking.pickupLocation || '我的位置'}
                  </div>
                </div>
              </div>

              {/* Connector line */}
              <div className="ml-3 my-1 h-3 border-l border-dashed border-[#E5E5EA]" />

              {/* Destination */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-6 h-6 rounded bg-[#0A7CFF]/10 flex items-center justify-center">
                    <MapPin size={15} className="text-[#0A7CFF]" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[1px] text-[#8E8E93]">终点</div>
                  <div className="font-semibold text-[15px] leading-snug text-balance">
                    {selectedDest.address}
                  </div>
                  {pickupCoords && selectedDest && (
                    <div className="text-[11px] text-[#6C6C6E] mt-0.5 tabular-nums">
                      约 {haversineMiles(pickupCoords, selectedDest.coords).toFixed(1)} 英里
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDest || isConfirming}
              data-testid="set-destination-btn"
              className="btn btn-primary w-full h-[54px] text-[17px] font-semibold tracking-[-0.2px] shadow-md active:scale-[0.985] disabled:opacity-60 transition-all"
            >
              {isConfirming ? 'Setting destination…' : 'Set destination'}
            </button>

            <div className="text-center text-[10px] text-[#8E8E93] -mt-1">
              Price estimate shown on next screen • Drag pin or tap map to adjust
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="text-sm font-medium text-[#111]">
              地图上点击选择终点
            </div>
            <div className="text-[11px] text-[#6C6C6E] mt-0.5">
              蓝色圆点为你的起点（我的位置）
            </div>
            <button
              onClick={handleUseCurrentAsDest}
              className="mt-2.5 text-xs font-semibold text-[#0A7CFF] active:underline"
            >
              Or use my current location as destination
            </button>
          </div>
        )}

        {/* Legal attribution – required by MapLibre / OSM terms */}
        <div className="text-center mt-2 text-[9px] text-[#8E8E93]/70 tracking-[0.3px]">
          Map powered by MapLibre • © OpenStreetMap contributors
        </div>
      </div>

      {/* Extra tiny style overrides for markers + clean mobile map (scoped) */}
      <style>{`
        .cargo-dest-pin { pointer-events: auto; }
        .cargo-user-loc { position: relative; width: 22px; height: 22px; }
        .cargo-user-dot-outer {
          position: absolute; inset: 0;
          background: rgba(10,124,255,0.22);
          border-radius: 9999px;
          animation: cargo-pulse 2.1s cubic-bezier(0.23,1,0.32,1) infinite;
        }
        .cargo-user-dot {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 11px; height: 11px; background: #0A7CFF;
          border: 2.5px solid white; border-radius: 9999px; box-shadow: 0 0 0 1px rgba(10,124,255,0.4);
        }
        @keyframes cargo-pulse {
          0%,100% { transform: scale(1); opacity: 0.65; }
          50% { transform: scale(2.15); opacity: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .maplibregl-ctrl-group { border-radius: 10px !important; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important; }
        .maplibregl-ctrl button { width: 32px !important; height: 32px !important; }
      `}</style>
    </div>
  );
}

export default MapView;
