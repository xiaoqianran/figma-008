import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';

/**
 * Figma screen 12: My favorites
 * Now fully store-backed for persistence. Tapping a place quickly books to it
 * (sets destination in booking store and jumps to service selection).
 * Add/remove fully functional + delightful empty state + quick actions.
 * Tab bar always visible. No edits to core map booking flow.
 */
function getPlaceIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('home') || n.includes('house')) return '🏠';
  if (n.includes('work') || n.includes('office')) return '🏢';
  if (n.includes('gym') || n.includes('fitness')) return '💪';
  if (n.includes('airport') || n.includes('plane')) return '✈️';
  if (n.includes('school') || n.includes('uni')) return '🎓';
  if (n.includes('park')) return '🌳';
  if (n.includes('cafe') || n.includes('coffee')) return '☕';
  return '📍';
}

export function FavoritesScreen() {
  const navigate = useNavigate();
  const { favorites, updateBooking, removeFavorite } = useAppStore();

  const handleBookFromFavorite = (place: { name: string; address: string; coords?: { lat: number; lng: number } }) => {
    updateBooking({
      destinationLocation: place.address,
      destinationCoords: place.coords,
    });
    toast.success(`Booking to ${place.name}`, {
      description: place.address,
    });
    // Quick re-use: jump directly to service selection (destination already set in store)
    // This provides delightful one-tap booking from the Favorites tab without touching map UI.
    navigate('/service');
  };

  const handleRemove = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(id);
    toast.info(`Removed "${name}"`, { description: 'Place removed from favorites' });
  };

  return (
    <div className="screen overflow-y-auto bg-[#F8F9FA] pb-20 text-[#222b45]">
      <div className="px-4 pt-5 flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-[-0.5px]">My favorites</div>
          <div className="text-[#8f9bb3] text-sm mt-0.5">
            {favorites.length} saved place{favorites.length === 1 ? '' : 's'} · Quick booking
          </div>
        </div>
        <button
          onClick={() => navigate('/add-place')}
          className="flex items-center gap-1 text-[#41d5fb] text-sm font-semibold active:opacity-70"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {favorites.length === 0 ? (
        // Improved, delightful empty state
        <div className="flex flex-col items-center justify-center px-8 pt-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E8F4FF] flex items-center justify-center mb-4">
            <MapPin size={32} className="text-[#0A7CFF]" />
          </div>
          <div className="font-semibold text-lg tracking-[-0.3px]">No favorites yet</div>
          <p className="text-[#6C6C6E] text-sm mt-2 max-w-[260px]">
            Save places you visit often for instant one-tap bookings from this tab.
          </p>
          <button
            onClick={() => navigate('/add-place')}
            className="mt-6 btn btn-primary px-6 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add your first place
          </button>
          <div className="mt-4 text-[10px] text-[#8E8E93]">Saved places persist across sessions</div>
        </div>
      ) : (
        <div className="mt-4 px-3 space-y-2">
          {favorites.map((place) => {
            const icon = getPlaceIcon(place.name);
            return (
              <div
                key={place.id}
                onClick={() => handleBookFromFavorite(place)}
                className="card flex items-center gap-4 p-4 active:bg-white border border-[#e4e9f2] rounded-[12px] cursor-pointer active:scale-[0.985] transition-transform"
              >
                <div className="text-3xl w-10 flex-shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px]">{place.name}</div>
                  <div className="text-[#8f9bb3] text-sm flex items-center gap-1 mt-0.5">
                    <MapPin size={13} /> {place.address}
                  </div>
                </div>

                {/* Remove action (does not trigger booking) */}
                <button
                  onClick={(e) => handleRemove(place.id, place.name, e)}
                  className="p-2 -mr-1 text-[#8E8E93] active:text-[#FF3B30] rounded-full active:bg-red-50 transition-colors"
                  aria-label={`Remove ${place.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick add CTA always available when list present (matches Figma 13 entry) */}
      {favorites.length > 0 && (
        <div className="px-4 mt-8">
          <button
            onClick={() => navigate('/add-place')}
            className="w-full flex items-center justify-center gap-2 text-[#41d5fb] text-sm font-medium py-3 border border-dashed border-[#41d5fb]/40 rounded-[12px] active:bg-white/70"
          >
            <Plus size={16} /> Add new place (Figma screen 13)
          </button>
        </div>
      )}
    </div>
  );
}
