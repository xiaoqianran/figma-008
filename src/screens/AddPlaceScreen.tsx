import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';

/**
 * Figma screen 13: Add new place
 * Form + map teaser, exact input heights and 12px radius from spec.
 * Now fully persists to Zustand store (favorites) for cross-tab use in Favorites tab.
 */
export function AddPlaceScreen() {
  const navigate = useNavigate();
  const { addFavorite } = useAppStore();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const handleSave = () => {
    if (!name || !address) return;
    addFavorite({ name: name.trim(), address: address.trim() });
    toast.success(`Saved "${name.trim()}"`, {
      description: 'Added to your Favorites · Available for quick booking',
    });
    navigate('/favorites');
  };

  return (
    <div className="screen overflow-y-auto bg-white px-4 pb-8 text-[#222b45]">
      <div className="pt-5">
        <div className="text-xl font-semibold tracking-[-0.3px]">Add new place</div>
        <div className="text-[#8f9bb3] text-sm mt-1">Save locations for faster booking</div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="text-xs uppercase tracking-[1px] text-[#8f9bb3] mb-1.5 pl-0.5">
            PLACE NAME
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom’s house"
            className="input"
          />
        </div>

        <div>
          <div className="text-xs uppercase tracking-[1px] text-[#8f9bb3] mb-1.5 pl-0.5">
            ADDRESS
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city"
            className="input"
          />
        </div>

        {/* Map teaser (Figma shows map area) */}
        <div className="h-40 bg-[#E8E8E8] rounded-[12px] flex items-center justify-center text-[#8f9bb3] text-sm border border-[#e4e9f2]">
          <div className="flex flex-col items-center">
            <MapPin size={28} className="mb-1 text-[#41d5fb]" />
            <span>Tap map to set exact pin</span>
            <span className="text-[10px]">(Interactive map coming in Phase 2)</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!name || !address}
        className="btn btn-primary w-full mt-8 text-[17px] font-semibold disabled:opacity-60"
      >
        Save place
      </button>

      <button onClick={() => navigate(-1)} className="w-full mt-3 text-sm text-[#8f9bb3]">
        Cancel
      </button>
    </div>
  );
}
