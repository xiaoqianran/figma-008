import { Clock, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type RideType, useAppStore } from '../stores/useAppStore';

const RIDE_OPTIONS: Array<{
  type: RideType;
  label: string;
  desc: string;
  eta: string;
  price: number;
  seats: number;
  icon: string;
}> = [
  {
    type: 'economy',
    label: 'Economy',
    desc: 'Affordable rides',
    eta: '2 min',
    price: 8.4,
    seats: 4,
    icon: '🚗',
  },
  {
    type: 'comfort',
    label: 'Comfort',
    desc: 'Extra legroom',
    eta: '4 min',
    price: 14.2,
    seats: 4,
    icon: '🚙',
  },
  {
    type: 'premium',
    label: 'Premium',
    desc: 'Tesla & luxury',
    eta: '5 min',
    price: 21.5,
    seats: 4,
    icon: '✨',
  },
  {
    type: 'xl',
    label: 'XL',
    desc: 'For groups up to 6',
    eta: '7 min',
    price: 28,
    seats: 6,
    icon: '🚐',
  },
];

export function SelectServiceScreen() {
  const navigate = useNavigate();
  const { booking, updateBooking } = useAppStore();
  const [selected, setSelected] = useState<RideType | null>(booking.rideType);

  const selectAndContinue = (type: RideType, price: number) => {
    setSelected(type);
    updateBooking({ rideType: type, estimatedPrice: price });
    // Go to payment (or pickup time modal in Figma 20)
    setTimeout(() => navigate('/payment'), 180);
  };

  return (
    <div className="screen flex flex-col bg-[#F8F9FA] text-black overflow-auto pb-8">
      <div className="px-4 pt-4">
        <div className="font-semibold text-xl tracking-[-0.3px]">Choose your ride</div>
        <div className="text-[#6C6C6E] text-sm mt-0.5">
          {booking.destinationLocation || 'Select a destination first'}
        </div>
      </div>

      {/* Suggested rides (Figma 14 & 15) */}
      <div className="mt-4 space-y-2 px-3">
        {RIDE_OPTIONS.map((ride) => {
          const isSel = selected === ride.type;
          return (
            <button
              key={ride.type}
              onClick={() => selectAndContinue(ride.type, ride.price)}
              className={`ride-card w-full flex gap-4 bg-white border rounded-2xl p-4 text-left active:opacity-90 ${isSel ? 'selected border-[#0A7CFF]' : 'border-transparent'}`}
            >
              <div className="text-4xl w-12 pt-1">{ride.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="font-semibold text-lg">{ride.label}</div>
                  <div className="font-semibold text-lg tabular-nums">${ride.price}</div>
                </div>
                <div className="text-sm text-[#6C6C6E]">{ride.desc}</div>

                <div className="flex items-center gap-4 mt-3 text-xs text-[#8E8E93]">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {ride.eta}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {ride.seats} seats
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4 text-[10px] text-center text-[#8E8E93]">
        Prices include taxes • Estimated for your trip
      </div>

      {/* Promo entry hint (Figma 16) */}
      <button
        onClick={() => {
          const code = prompt('Enter promo code (try CARGO20)');
          if (code) {
            updateBooking({ promoCode: code });
            alert(`Promo ${code} applied! 20% off selected ride.`);
          }
        }}
        className="mx-4 mt-6 text-sm py-3 border border-dashed rounded-xl text-[#0A7CFF]"
      >
        + Add promo code (screen 16)
      </button>
    </div>
  );
}
