import { Heart, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Figma screen 12: My favorites
 * Clean list of saved places + "Add new place" entry point.
 * Uses exact spacing/radius from spec (16px padding, 12px cards).
 */
const FAVORITES = [
  { id: 1, name: 'Home', address: '874 Hildegard Crossing', icon: '🏠' },
  { id: 2, name: 'Work', address: '27 Sawayn Square', icon: '🏢' },
  { id: 3, name: 'Gym', address: 'Mission Bay', icon: '💪' },
];

export function FavoritesScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen overflow-y-auto bg-[#F8F9FA] pb-20 text-[#222b45]">
      <div className="px-4 pt-5 flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-[-0.5px]">My favorites</div>
          <div className="text-[#8f9bb3] text-sm mt-0.5">Saved places for quick booking</div>
        </div>
        <button
          onClick={() => navigate('/add-place')}
          className="flex items-center gap-1 text-[#41d5fb] text-sm font-semibold active:opacity-70"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="mt-4 px-3 space-y-2">
        {FAVORITES.map((place) => (
          <div
            key={place.id}
            onClick={() => {
              // Simulate selecting favorite → go to destination with prefilled value
              navigate('/destination', { state: { prefill: place.address } });
            }}
            className="card flex items-center gap-4 p-4 active:bg-white border border-[#e4e9f2] rounded-[12px] cursor-pointer"
          >
            <div className="text-3xl w-10">{place.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px]">{place.name}</div>
              <div className="text-[#8f9bb3] text-sm flex items-center gap-1 mt-0.5">
                <MapPin size={13} /> {place.address}
              </div>
            </div>
            <Heart size={18} className="text-[#41d5fb]" />
          </div>
        ))}
      </div>

      {FAVORITES.length === 0 && (
        <div className="text-center py-12 text-[#8f9bb3] text-sm">No favorites yet</div>
      )}

      <div className="px-4 mt-8">
        <button
          onClick={() => navigate('/add-place')}
          className="w-full flex items-center justify-center gap-2 text-[#41d5fb] text-sm font-medium py-3 border border-dashed border-[#41d5fb]/40 rounded-[12px] active:bg-white/70"
        >
          <Plus size={16} /> Add new place (Figma screen 13)
        </button>
      </div>
    </div>
  );
}
