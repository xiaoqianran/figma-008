import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LatLng } from '../components/maps/geocode';
import { useAppStore } from '../stores/useAppStore';

/**
 * Production DestinationScreen — now a full interactive MapLibre destination picker.
 *
 * Replaces the previous static list with:
 * - Real draggable + tappable map (lazy loaded for bundle size)
 * - Live reverse geocoding + Photon search
 * - Route preview, custom markers, geolocation
 * - Floating confirm panel matching Figma aesthetics
 *
 * After confirm → updates booking (destinationLocation + estimatedPrice + coords) and routes to /service.
 * Preserves tab bar + device frame as required.
 *
 * The heavy MapView is code-split via React.lazy (leverages existing 'map-vendor' chunk).
 */

// Lazy load the map implementation (critical for initial bundle + perf)
const MapView = React.lazy(() =>
  import('../components/maps/MapView').then((m) => ({ default: m.MapView }))
);

export function DestinationScreen() {
  const navigate = useNavigate();
  const { booking, updateBooking } = useAppStore();

  // Pass any previously chosen coords (supports coming back in flow)
  const initialDest = booking.destinationCoords;
  const initialPickup = booking.pickupCoords;

  const handleConfirmDestination = (address: string, coords: LatLng, estimatedPrice: number) => {
    updateBooking({
      destinationLocation: address,
      destinationCoords: coords,
      estimatedPrice,
    });
    // Exactly matches the original flow requirement
    navigate('/service');
  };

  return (
    <div className="screen flex flex-col bg-white text-black overflow-hidden">
      {/* The entire interactive map experience lives here (full-bleed under header) */}
      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-[#F8F9FA]">
              <div className="flex flex-col items-center gap-4 text-[#6C6C6E]">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#41d5fb] border-t-transparent" />
                <div className="text-sm font-medium tracking-[-0.1px]">Preparing map…</div>
                <div className="text-[10px] text-[#8E8E93]">Vector tiles • Free • No key</div>
              </div>
            </div>
          }
        >
          <MapView
            onConfirmDestination={handleConfirmDestination}
            initialDestCoords={initialDest}
            initialPickupCoords={initialPickup}
          />
        </Suspense>
      </div>

      {/* Subtle pickup reminder bar (visible above tab bar when map is shown) */}
      <div className="absolute bottom-[58px] left-0 right-0 z-[45] px-3 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-[320px] text-[10px] bg-white/90 backdrop-blur border border-[#E5E5EA] rounded-full px-3 py-1 text-center text-[#6C6C6E] shadow-sm">
          起点: <span className="font-medium text-black">{booking.pickupLocation || '我的位置'}</span> •{' '}
          {booking.pickupTime}
        </div>
      </div>
    </div>
  );
}
