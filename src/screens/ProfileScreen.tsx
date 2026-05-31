import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout, rideHistory } = useAppStore();

  const stats = {
    totalRides: rideHistory.length,
    totalSpent: rideHistory.reduce((sum, r) => sum + r.price, 0),
  };

  return (
    <div className="screen bg-[#F8F9FA] pb-20 overflow-auto">
      <div className="px-4 pt-8">
        <div className="text-2xl font-semibold tracking-[-0.5px] mb-6">Profile</div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E5EA]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A7CFF] to-[#0059CC] flex items-center justify-center text-white text-2xl font-semibold ring-4 ring-white">
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <div className="font-semibold text-lg">{user?.name || 'Alex Rivera'}</div>
              <div className="text-sm text-[#6C6C6E]">{user?.phone || '+1 (555) 987-6543'}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-4 border border-[#E5E5EA]">
            <div className="text-xs text-[#8E8E93]">TOTAL RIDES</div>
            <div className="text-3xl font-semibold mt-1">{stats.totalRides}</div>
          </div>
          <div className="bg-white rounded-3xl p-4 border border-[#E5E5EA]">
            <div className="text-xs text-[#8E8E93]">TOTAL SPENT</div>
            <div className="text-3xl font-semibold mt-1">${stats.totalSpent}</div>
          </div>
        </div>

        <div className="mt-6 space-y-px bg-white rounded-3xl overflow-hidden border border-[#E5E5EA]">
          {[
            { label: 'Payment Methods', action: () => toast('Payment methods', { description: 'Opens Figma flow 17-19 (demo)' }) },
            { label: 'Ride History', action: () => navigate('/activity') },
            { label: 'Saved Places', action: () => navigate('/favorites') },
            { label: 'Help & Support', action: () => {} },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full px-5 py-4 text-left flex justify-between items-center active:bg-zinc-50 border-b last:border-b-0 border-[#E5E5EA] text-[15px]"
            >
              <span>{item.label}</span>
              <span className="text-[#8E8E93]">›</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="mt-8 w-full py-3.5 text-[#FF3B30] font-semibold active:bg-red-50 rounded-2xl border border-[#FF3B30]/20"
        >
          Log Out
        </button>
      </div>

    </div>
  );
}
