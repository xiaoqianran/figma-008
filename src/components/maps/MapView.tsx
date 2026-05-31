import maplibregl, { type Map as MapLibreMap, type Marker, type LngLatLike } from 'maplibre-gl';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * - Clean global map: only the destination pin is shown.
 * - Starting point (起点) is the user's current location (from booking store), used only for the route line and price.
 * - No visual origin marker on the map itself — user simply taps to choose the destination.
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
// Now with prominent "终点" label badge so distinction is instant: 起点 (green dot) → 终点 (pin)
function createDestinationMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'cargo-dest-wrapper';
  el.innerHTML = `
    <div class="cargo-dest-label">终点</div>
    <div class="cargo-dest-pin">
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
    </div>
  `;
  el.style.cursor = 'grab';
  el.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))';
  return el;
}

// We deliberately do NOT render any visual marker for the starting point on the map.
// The origin (起点) is the user's current location from the store (booking.pickupCoords or geolocation).
// It is only used for the route line and price calculation. The map is kept clean for destination selection.

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

  // Refactored destination state to eliminate flicker:
  // - destCoords set immediately for instant button + route preview responsiveness
  // - destAddress + isResolvingAddress drive smooth "Loading address…" UI instead of hard "Selected location" swaps
  // Panel derives display from these + uses Framer Motion transitions
  const [destCoords, setDestCoords] = useState<LatLng | null>(null);
  const [destAddress, setDestAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const [userLocation, setUserLocation] = useState<LatLng>(initialPickupCoords || SF_DEFAULT);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentDestCoordsRef = useRef<LatLng | null>(null);

  // Store access for pickup (read-only in map for preview)
  const { booking } = useAppStore();

  // Current pickup coords (fallback to userLocation)
  const pickupCoords: LatLng = booking.pickupCoords || initialPickupCoords || userLocation;

  // Debounced reverse geocode for marker drag / tap
  // Sets loading state + real address only when coords still current (stale-proof)
  const debouncedReverse = useCallback(
    debounce(async (coords: LatLng) => {
      const ac = new AbortController();
      abortControllerRef.current = ac;

      setIsResolvingAddress(true);
      const address = await reverseGeocode(coords, ac.signal);

      const current = currentDestCoordsRef.current;
      const stillCurrent =
        current &&
        Math.abs(current.lat - coords.lat) < 0.0001 &&
        Math.abs(current.lng - coords.lng) < 0.0001;

      if (stillCurrent) {
        if (address) {
          setDestAddress(address);
        } else {
          setDestAddress(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
        setIsResolvingAddress(false);
      }
      // if not current, ignore (newer selection already managing state)
    }, 420),
    []
  );

  // Draw / update straight-line route preview layer (high value, zero cost)
  // STABILITY FIX: use setData on existing source for live updates (no remove/add flicker on rapid taps/drags)
  // Declared early so updateDestMarker (which closes over it in drag handler + lists in deps) is valid.
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

    const existingSource = map.getSource(routeLayerId) as maplibregl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(geojson);
      return;
    }

    // First time: create (remove any stale just in case)
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
        'line-width': 4.5,
        'line-opacity': 0.9,
        'line-dasharray': [0, 0], // solid for maximum clarity of 起点→终点 connection
      },
    });
  }, []);

  // Update or create the destination marker (draggable)
  // NOTE: No longer does any address state setting inside (prevents races). Callers manage destCoords/destAddress/isResolving.
  // Drag/tap now use loading state + debounced reverse for flicker-free address updates.
  const updateDestMarker = useCallback(
    (coords: LatLng) => {
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

          // Immediately update coords (for responsive line + button), show loading for address (no 'Selected location' flash)
          setDestCoords(newCoords);
          currentDestCoordsRef.current = newCoords;
          setDestAddress(null);
          setIsResolvingAddress(true);

          debouncedReverse(newCoords);
          if (pickupCoords) {
            updateRoutePreview(pickupCoords, newCoords);
          }
          // Deliberately NO fitRouteInView on drag adjustments (stability: only fit on initial selection)
          map.panTo([newCoords.lng, newCoords.lat], { duration: 180 });
        });

        // Click on marker recenters nicely (use live position to avoid stale closure)
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const live = destMarkerRef.current?.getLngLat();
          const c = live ? { lng: live.lng, lat: live.lat } : coords;
          map.flyTo({ center: [c.lng, c.lat], zoom: PIN_ZOOM, duration: 420 });
        });

        destMarkerRef.current = marker;
      } else {
        destMarkerRef.current.setLngLat([coords.lng, coords.lat] as LngLatLike);
      }
    },
    [debouncedReverse, pickupCoords, updateRoutePreview]
  );

  // Fit map view to show BOTH 起点 (pickup) and 终点 (dest) + the connecting line clearly.
  // Called on explicit destination selection (tap, search, quick place) so the origin→destination relationship is instantly obvious.
  // Does not fight free panning after the fact.
  const fitRouteInView = useCallback((pickup: LatLng, dest: LatLng) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(pickup.lng, dest.lng) - 0.001, Math.min(pickup.lat, dest.lat) - 0.001] as [number, number],
        [Math.max(pickup.lng, dest.lng) + 0.001, Math.max(pickup.lat, dest.lat) + 0.001] as [number, number]
      );
      map.fitBounds(bounds, {
        padding: { top: 140, bottom: 260, left: 60, right: 60 }, // generous so labels + panel + search bar don't obscure
        duration: 620,
        maxZoom: 15.5,
      });
    } catch (_) {
      // graceful: fall back to simple fly centering the midpoint
      const midLat = (pickup.lat + dest.lat) / 2;
      const midLng = (pickup.lng + dest.lng) / 2;
      map.flyTo({ center: [midLng, midLat], zoom: 13.5, duration: 520 });
    }
  }, []);

  // No visual origin marker is rendered on the map (clean global map experience).
  // Origin is handled logically via pickupCoords for route + price only.

  // Fly camera + optionally move marker + reverse geocode
  // Now also manages dest state: if label provided (search/quick/geoloc), set real address immediately (no loading).
  // For map taps/drags we use the loading path instead (elsewhere).
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
          updateDestMarker(coords); // visual only now

          // Set dest state immediately for responsiveness
          setDestCoords(coords);
          currentDestCoordsRef.current = coords;
          if (label) {
            setDestAddress(label);
            setIsResolvingAddress(false);
          } else {
            setDestAddress(null);
            setIsResolvingAddress(true);
            debouncedReverse(coords);
          }

          // Immediately draw clear 起点→终点 line + fit view (explicit navigation => fit is desired)
          if (pickupCoords) {
            updateRoutePreview(pickupCoords, coords);
            fitRouteInView(pickupCoords, coords);
          }
        }, 120);
      }
    },
    [updateDestMarker, updateRoutePreview, pickupCoords, fitRouteInView, debouncedReverse]
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

          // Clean global map — no visual marker for the starting point.
          // Origin is taken from the booking store (user's location) and only used for the route line + price.

          // Do NOT auto-place a destination marker on load.
          // Let the user explicitly choose the destination (终点) by tapping or searching.
          // On first choice: distinct "终点" pin appears + solid blue line instantly connects 起点→终点 + view fits both.
          // This makes the UX instantly communicate: "起点 = 我 (green) → 终点 = 我选的 (pin)".

          // If we already have a previous destination (coming back in flow), restore it + draw route + fit to show clear 起点→终点
          // State management here ensures we start with resolved or loading (no flicker on mount)
          if (initialDestCoords) {
            setDestCoords(initialDestCoords);
            currentDestCoordsRef.current = initialDestCoords;
            const priorAddr = booking.destinationLocation;
            if (priorAddr) {
              setDestAddress(priorAddr);
              setIsResolvingAddress(false);
            } else {
              setDestAddress(null);
              setIsResolvingAddress(true);
              // Immediate (non-debounced) reverse for restore path
              reverseGeocode(initialDestCoords).then((addr) => {
                const c = currentDestCoordsRef.current;
                if (
                  c &&
                  Math.abs(c.lat - initialDestCoords.lat) < 0.0001 &&
                  Math.abs(c.lng - initialDestCoords.lng) < 0.0001
                ) {
                  setDestAddress(addr || `${initialDestCoords.lat.toFixed(4)}, ${initialDestCoords.lng.toFixed(4)}`);
                  setIsResolvingAddress(false);
                }
              });
            }
            updateDestMarker(initialDestCoords);
            if (pickupCoords) {
              updateRoutePreview(pickupCoords, initialDestCoords);
              fitRouteInView(pickupCoords, initialDestCoords);
            }
          }

          // Tap anywhere on map → place distinct 终点 marker + immediately draw clear line from 起点
          // KEY FLICKER FIX: set coords + loading state immediately (button responsive), use "Loading address…" + transition instead of 'Selected location' hard-swap.
          // Fit ONLY on first selection (subsequent taps just adjust without camera jump for stability)
          map.on('click', (e) => {
            const coords: LatLng = { lat: e.lngLat.lat, lng: e.lngLat.lng };

            const isFirstSelection = !currentDestCoordsRef.current;

            setDestCoords(coords);
            currentDestCoordsRef.current = coords;
            setDestAddress(null);
            setIsResolvingAddress(true);

            updateDestMarker(coords);
            debouncedReverse(coords); // will update the real address later (stale-safe)
            updateRoutePreview(pickupCoords, coords);
            if (isFirstSelection && pickupCoords) {
              fitRouteInView(pickupCoords, coords);
            }
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

  // When external initial coords change (rare), sync marker (visual only; state restore handled at init)
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
          // No visual user marker on map (clean experience)

          const map = mapRef.current;
          if (map) {
            map.flyTo({ center: [coords.lng, coords.lat], zoom: 14.5, duration: 620 });
          }

          // Reverse for nice pickup label if user wants to "set pickup"
          const addr = await reverseGeocode(coords);
          if (!centerOnly) {
            // For destination picker flow, center + offer as potential dest too
            setDestCoords(coords);
            currentDestCoordsRef.current = coords;
            setDestAddress(addr || 'Your current location');
            setIsResolvingAddress(false);
            updateDestMarker(coords); // visual only
            if (pickupCoords) {
              updateRoutePreview(pickupCoords, coords);
              fitRouteInView(pickupCoords, coords);
            }
          }

          // Also expose to parent via side effect on store (caller decides)
          setIsLocating(false);
        },
        (err) => {
          console.info('[CARGO Map] Geolocation denied or unavailable, using SF default.', err);
          setIsLocating(false);
          const fallback = SF_DEFAULT;
          setUserLocation(fallback);
          // No visual user marker on map (clean experience)
          const map = mapRef.current;
          if (map)
            map.flyTo({ center: [fallback.lng, fallback.lat], zoom: DEFAULT_ZOOM, duration: 400 });
          if (!centerOnly) {
            setDestCoords(fallback);
            currentDestCoordsRef.current = fallback;
            setDestAddress('San Francisco, CA (demo)');
            setIsResolvingAddress(false);
            updateDestMarker(fallback); // visual only
            if (pickupCoords) {
              updateRoutePreview(pickupCoords, fallback);
              fitRouteInView(pickupCoords, fallback);
            }
          }
        },
        { enableHighAccuracy: true, timeout: 8500, maximumAge: 60_000 }
      );
    },
    [
      flyToLocation,
      updateDestMarker,
      updateRoutePreview,
      // updateUserMarker removed (clean map, no origin marker rendered)
      userLocation,
      pickupCoords,
      fitRouteInView,
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
    // flyTo already draws line + fits; ensure one more sync in case
    updateRoutePreview(pickupCoords, s.coords);
    fitRouteInView(pickupCoords, s.coords);
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
    fitRouteInView(pickupCoords, coords);
    setShowSuggestions(false);
  };

  // Confirm flow – exactly as required (update store + route to /service)
  // Robust: if still resolving address on tap (rare, user fast-click), force a resolve so we never persist the loading placeholder text.
  const handleConfirm = async () => {
    if (!destCoords) return;

    setIsConfirming(true);
    // Small delay for perceived reliability (matches high-quality prototypes)
    await new Promise(r => setTimeout(r, 120));

    let addressToUse = destAddress;
    if (!addressToUse || isResolvingAddress) {
      try {
        const forcedAddr = await reverseGeocode(destCoords);
        addressToUse = forcedAddr || `${destCoords.lat.toFixed(4)}, ${destCoords.lng.toFixed(4)}`;
      } catch {
        addressToUse = `${destCoords.lat.toFixed(4)}, ${destCoords.lng.toFixed(4)}`;
      }
    }

    const price = calculateEstimatedPrice(pickupCoords, destCoords);
    onConfirmDestination(addressToUse, destCoords, price);
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
    fitRouteInView(pickupCoords, coords);
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
                placeholder={destCoords ? (destAddress || (isResolvingAddress ? 'Loading address…' : 'Selected location')) || 'Where to?' : 'Where to?'}
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

          {/* Pickup indicator (subtle, always visible) — reinforces 起点 = fixed origin */}
          <div className="mt-1.5 pl-1 text-[10px] uppercase tracking-[0.5px] text-[#8E8E93] flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" /> 起点:{' '}
            {booking.pickupLocation || '我的位置'}
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
      {/* ALWAYS shows 起点 (fixed origin = 我的位置 / booking pickup) and 终点 (user-chosen on map) */}
      {/* This makes the origin/destination relationship crystal clear the instant the Explore map loads */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-white via-white to-white/95 border-t border-[#E5E5EA]">
        <div className="space-y-3">
          {/* Mini summary card - ALWAYS visible: 起点 → 终点 (even before any selection) */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-3 shadow-sm text-sm">
            {/* Origin (起点) - always the fixed pickup / my current location */}
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

            {/* Connector line (visual start → end) */}
            <div className="ml-3 my-1 h-3 border-l border-dashed border-[#E5E5EA]" />

            {/* Destination (终点) - prominent, updates live on tap/search/drag */}
            {/* FLICKER ELIMINATION: derive display from destCoords + loading flag; use Framer Motion + AnimatePresence for smooth crossfade between "Loading address…" and real address. No more abrupt 'Selected location' → real swap. */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-6 h-6 rounded bg-[#0A7CFF]/10 flex items-center justify-center">
                  <MapPin size={15} className="text-[#0A7CFF]" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[1px] text-[#8E8E93]">终点</div>
                <div className="font-semibold text-[15px] leading-snug text-balance min-h-[20px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={destCoords ? (destAddress || (isResolvingAddress ? 'loading' : 'pending')) : 'no-dest'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.23, 1.0, 0.32, 1] }}
                    >
                      {destCoords
                        ? (destAddress || (isResolvingAddress ? 'Loading address…' : 'Selected location'))
                        : '请在地图上点击或搜索选择'}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {pickupCoords && destCoords && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: 0.03 }}
                    className="text-[11px] text-[#6C6C6E] mt-0.5 tabular-nums"
                  >
                    约 {haversineMiles(pickupCoords, destCoords).toFixed(1)} 英里
                  </motion.div>
                )}
                {!destCoords && (
                  <div className="text-[11px] text-[#6C6C6E] mt-0.5">
                    点击地图选择目的地
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!destCoords || isConfirming}
            data-testid="set-destination-btn"
            className="btn btn-primary w-full h-[54px] text-[17px] font-semibold tracking-[-0.2px] shadow-md active:scale-[0.985] disabled:opacity-60 transition-all"
          >
            {isConfirming ? 'Setting destination…' : 'Set destination'}
          </button>

          <div className="text-center text-[10px] text-[#8E8E93] -mt-1 flex items-center justify-center gap-3">
            <span>Price estimate shown on next screen • Drag pin or tap map to adjust</span>
            {!destCoords && (
              <button
                onClick={handleUseCurrentAsDest}
                className="text-[#0A7CFF] active:underline font-medium"
              >
                用当前位置作终点
              </button>
            )}
          </div>
        </div>

        {/* Legal attribution – required by MapLibre / OSM terms */}
        <div className="text-center mt-2 text-[9px] text-[#8E8E93]/70 tracking-[0.3px]">
          Map powered by MapLibre • © OpenStreetMap contributors
        </div>
      </div>

      {/* Extra tiny style overrides for markers + clean mobile map (scoped) */}
      <style>{`
        .cargo-dest-wrapper { position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: auto; }
        .cargo-dest-pin { pointer-events: auto; }
        .cargo-dest-label {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          background: #0A7CFF;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.6px;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          pointer-events: none;
          line-height: 1.1;
          border: 1px solid rgba(255,255,255,0.9);
          z-index: 1;
        }
        .cargo-user-loc { position: relative; width: 22px; height: 22px; }
        .cargo-user-dot-outer {
          position: absolute; inset: 0;
          background: rgba(52,199,89,0.25);
          border-radius: 9999px;
          animation: cargo-pulse 2.1s cubic-bezier(0.23,1,0.32,1) infinite;
        }
        .cargo-user-dot {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 12px; height: 12px; background: #34C759;
          border: 2.5px solid white; border-radius: 9999px; box-shadow: 0 0 0 1px rgba(52,199,89,0.45);
        }
        .cargo-user-label {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: #34C759;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.6px;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          pointer-events: none;
          line-height: 1.1;
          border: 1px solid rgba(255,255,255,0.9);
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

