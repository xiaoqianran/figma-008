import { Clock, Repeat, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';

/**
 * Activity / Ride History screen
 * Fully store-connected with "Book again" quick action.
 * Sets booking state from history and jumps to service selection for instant rebooking.
 * Tab bar always present. Great cross-tab flow completion.
 */
export function ActivityScreen() {
  const navigate = useNavigate();
  const { rideHistory, updateBooking } = useAppStore();

  const handleBookAgain = (ride: (typeof rideHistory)[0]) => {
    updateBooking({
      pickupLocation: ride.from,
      destinationLocation: ride.to,
      pickupCoords: ride.fromCoords,
      destinationCoords: ride.toCoords,
      estimatedPrice: ride.price,
      rideType: null,
      promoCode: null,
    });
    toast.success('Ride details loaded', {
      description: `Ready to book ${ride.from} → ${ride.to} again`,
    });
    // Jump to /service (service selection) for a fast rebook experience.
    // Booking state is pre-populated from history; tab bar hidden during flow as designed.
    navigate('/service');
  };

  return (
    <div className="screen overflow-y-auto bg-[#F8F9FA] pb-20 text-black">
      <div className="px-4 pt-5">
        <div className="text-2xl font-semibold tracking-[-0.5px]">Activity</div>
        <div className="text-[#6C6C6E] text-sm mt-1">
          Your recent rides · {rideHistory.length} total
        </div>
      </div>

      {rideHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[420px] text-center px-8">
          <Clock size={42} className="text-[#8E8E93] mb-4" />
          <div className="font-medium">No rides yet</div>
          <p className="text-sm text-[#6C6C6E] mt-2 max-w-[260px]">
            Complete your first booking and it will appear here. All rides are saved locally.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="mt-6 text-sm px-5 py-2.5 rounded-2xl bg-white border border-[#E5E5EA] active:bg-zinc-50 font-medium text-[#0A7CFF]"
          >
            Start your first ride
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 px-3">
          {rideHistory.map((ride) => (
            <div key={ride.id} className="card border border-[#E5E5EA] p-4 rounded-2xl">
              <div className="flex justify-between text-sm">
                <div>
                  <div className="font-semibold">{ride.from}</div>
                  <div className="text-[#6C6C6E] mt-0.5">→ {ride.to}</div>
                </div>
                <div className="text-right tabular-nums font-semibold">
                  ${ride.price.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-[#8E8E93]">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} /> {ride.date}
                </div>
                <div className="flex items-center gap-1 text-[#34C759]">
                  <Star size={13} fill="currentColor" /> {ride.rating} • {ride.driver}
                </div>
              </div>

              {/* "Book again" quick action — the key missing flow for delightful Activity tab */}
              <div className="mt-3 pt-3 border-t border-[#E5E5EA]">
                <button
                  onClick={() => handleBookAgain(ride)}
                  className="w-full flex items-center justify-center gap-2 text-[#0A7CFF] active:bg-[#0A7CFF]/5 active:scale-[0.985] text-sm font-semibold py-2 rounded-xl border border-[#0A7CFF]/20 transition-all"
                >
                  <Repeat size={15} /> Book again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
