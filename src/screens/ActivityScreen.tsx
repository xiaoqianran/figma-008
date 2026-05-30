import { useAppStore } from '../stores/useAppStore'
import { Clock, Star } from 'lucide-react'

/**
 * Activity / Ride History screen
 * Now fully functional — pulls from Zustand rideHistory.
 * Matches the spirit of Figma history cards (screen 16 had promo history style).
 */
export function ActivityScreen() {
  const { rideHistory } = useAppStore()

  return (
    <div className="screen overflow-y-auto bg-[#F8F9FA] pb-20 text-black">
      <div className="px-4 pt-5">
        <div className="text-2xl font-semibold tracking-[-0.5px]">Activity</div>
        <div className="text-[#6C6C6E] text-sm mt-1">Your recent rides</div>
      </div>

      {rideHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[420px] text-center px-8">
          <Clock size={42} className="text-[#8E8E93] mb-4" />
          <div className="font-medium">No rides yet</div>
          <p className="text-sm text-[#6C6C6E] mt-2 max-w-[260px]">
            Complete your first booking and it will appear here. All rides are saved locally.
          </p>
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
                <div className="text-right tabular-nums font-semibold">${ride.price.toFixed(2)}</div>
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-[#8E8E93]">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} /> {ride.date}
                </div>
                <div className="flex items-center gap-1 text-[#34C759]">
                  <Star size={13} fill="currentColor" /> {ride.rating} • {ride.driver}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
