/**
 * Free geocoding helpers for the CARGO interactive destination picker.
 * 
 * Providers (no API keys required):
 * - Reverse geocoding: Nominatim (OpenStreetMap) – https://nominatim.openstreetmap.org
 *   Rate limit: ~1 request / second. Always include a descriptive User-Agent.
 * - Forward / autocomplete: Photon (Komoot, OSM-powered) – https://photon.komoot.io
 *   Excellent for place suggestions, rate-friendly for demos.
 *
 * Offline resilience:
 *   For production offline maps + geocoding, bundle PMTiles (Protomaps) for vector tiles
 *   + a local address index / static fallback geocoder. See comment at end of MapView.tsx.
 *
 * All functions are resilient: return sensible fallbacks on network/CORS failure.
 */

export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodeResult {
  address: string
  coords: LatLng
}

/** Debounce helper (used by consumers for input/search) */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

/** Simple haversine distance in miles (for price estimation) */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8 // Earth radius miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(x))
}

/**
 * Reverse geocode lat/lng → human readable address.
 * Uses Nominatim. Includes polite User-Agent and handles errors gracefully.
 */
export async function reverseGeocode(
  { lat, lng }: LatLng,
  signal?: AbortSignal
): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CARGO-FigmaReplica/1.0 (demo ride hailing app; contact: dev@example.com)',
        'Accept': 'application/json',
      },
      signal,
    })

    if (!res.ok) throw new Error(`Nominatim ${res.status}`)

    const data = await res.json()
    const addr = data.display_name || data.name || ''

    // Prefer short nice name: "123 Main St, San Francisco, CA" style
    if (addr) {
      // Trim very long addresses for UI pills
      return addr.length > 72 ? addr.slice(0, 69) + '...' : addr
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch (e) {
    // Graceful fallback (CORS, offline, rate limit, etc.)
    if ((e as Error)?.name === 'AbortError') return ''
    console.warn('[CARGO Map] Reverse geocode failed, using coord fallback:', e)
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

/**
 * Forward search (autocomplete suggestions).
 * Uses Photon – fast and generous for interactive use.
 * Returns up to `limit` results with coords + display address.
 */
export async function searchPlaces(
  query: string,
  limit = 6,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return []

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}&lang=en`

  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Photon ${res.status}`)

    const data = await res.json()
    const features = data.features || []

    return features
      .map((f: any) => {
        const [lng, lat] = f.geometry?.coordinates || []
        if (typeof lat !== 'number' || typeof lng !== 'number') return null

        const props = f.properties || {}
        // Build a nice address label
        const parts = [
          props.name,
          props.street,
          props.housenumber ? `${props.housenumber}` : null,
          props.city || props.district,
          props.state,
        ].filter(Boolean)

        const address = parts.length ? parts.join(', ') : props.label || `${lat.toFixed(3)}, ${lng.toFixed(3)}`

        return {
          address: address.length > 80 ? address.slice(0, 77) + '...' : address,
          coords: { lat, lng },
        } as GeocodeResult
      })
      .filter(Boolean) as GeocodeResult[]
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return []
    console.warn('[CARGO Map] Search failed:', e)
    return []
  }
}

/**
 * Optional: Simple OSRM route fetch for future route preview enhancement.
 * Currently unused in v1 (we use straight-line GeoJSON for perf + simplicity).
 * Call this when you want real road-snapped geometry between pickup & dest.
 *
 * Returns GeoJSON LineString or null on failure.
 */
export async function fetchOSRMRoute(
  pickup: LatLng,
  dest: LatLng,
  signal?: AbortSignal
): Promise<GeoJSON.LineString | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=false`

  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error('OSRM fail')
    const json = await res.json()
    const route = json.routes?.[0]
    if (route?.geometry) return route.geometry as GeoJSON.LineString
    return null
  } catch (e) {
    console.warn('[CARGO Map] OSRM route fetch failed (using straight line fallback):', e)
    return null
  }
}

/**
 * SF-centric default for graceful geolocation fallback.
 * Financial District / Union Square area – nice for demo rides.
 */
export const SF_DEFAULT: LatLng = { lat: 37.7749, lng: -122.4194 }

/**
 * Nice nearby demo destinations (used for quick chips when no search results).
 * Exported for potential reuse in other components.
 */
export const DEMO_QUICK_PLACES: GeocodeResult[] = [
  { address: '100 Market St, San Francisco, CA', coords: { lat: 37.7936, lng: -122.3965 } },
  { address: 'San Francisco International Airport, CA', coords: { lat: 37.6213, lng: -122.3790 } },
  { address: '4th & King, San Francisco, CA', coords: { lat: 37.7765, lng: -122.3943 } },
  { address: '30th Ave & Fulton, San Francisco, CA', coords: { lat: 37.7694, lng: -122.4862 } },
]
