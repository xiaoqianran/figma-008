import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Phone, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export function RideTrackingScreen() {
  const navigate = useNavigate();
  const { activeRide, cancelRide, completeActiveRide, updateActiveRide } = useAppStore();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [rideStatus, setRideStatus] = useState<'arriving' | 'enroute'>('arriving');

  // Redirect if no active ride
  useEffect(() => {
    if (!activeRide) {
      navigate('/home', { replace: true });
    }
  }, [activeRide, navigate]);

  // Live ETA countdown (demo accelerated)
  useEffect(() => {
    if (!activeRide) return;

    const interval = setInterval(() => {
      const current = activeRide.etaMinutes;
      if (current <= 0) {
        handleAutoComplete();
        return;
      }

      const next = Math.max(0, current - 1);
      updateActiveRide({ etaMinutes: next });

      if (next <= 2 && rideStatus === 'arriving') {
        setRideStatus('enroute');
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [activeRide, updateActiveRide, rideStatus]);

  const handleAutoComplete = () => {
    setIsCompleting(true);
    setTimeout(() => {
      completeActiveRide();
      setIsCompleting(false);
      navigate('/home');
    }, 650);
  };

  const handleCompleteRide = () => {
    setIsCompleting(true);
    setTimeout(() => {
      completeActiveRide();
      setIsCompleting(false);
      navigate('/home');
    }, 420);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setShowCancelModal(false);
    await new Promise(r => setTimeout(r, 300));
    cancelRide();
    setIsCancelling(false);
    navigate('/home');
  };

  if (!activeRide) return null;

  const progress = Math.max(0, Math.min(100, ((8 - activeRide.etaMinutes) / 8) * 100));

  return (
    <div className="screen bg-[#F8F9FA] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between bg-white border-b border-[#E5E5EA]">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="p-2 -ml-2 text-[#0A7CFF]"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="font-semibold text-lg tracking-[-0.3px]">Your ride</div>
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="text-[#FF3B30] text-sm font-medium px-3 py-1.5 active:bg-red-50 rounded-xl"
        >
          Cancel
        </button>
      </div>

      {/* Status header */}
      <div className="bg-white px-4 py-5 border-b border-[#E5E5EA]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[#6C6C6E]">Status</div>
            <div className="text-2xl font-semibold tracking-[-0.5px] mt-0.5">
              {rideStatus === 'arriving' ? 'Driver arriving' : 'En route'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[42px] font-semibold tabular-nums leading-none tracking-[-1.5px] text-[#0A7CFF]">
              {activeRide.etaMinutes}
            </div>
            <div className="text-xs text-[#8E8E93] -mt-1">min</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#0A7CFF] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Driver card */}
      <div className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-[#E5E5EA] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A7CFF] to-[#0059CC] flex items-center justify-center text-white text-2xl font-semibold">
            {activeRide.driver[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xl tracking-[-0.3px]">{activeRide.driver}</div>
            <div className="text-[#6C6C6E] text-sm mt-0.5">{activeRide.vehicle}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[#FFB800] justify-end">
              <Star size={16} fill="currentColor" />
              <span className="font-semibold text-black">4.9</span>
            </div>
            <div className="text-[11px] text-[#8E8E93] mt-px">2,847 rides</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            className="flex-1 h-11 rounded-2xl border border-[#E5E5EA] font-medium flex items-center justify-center gap-2 active:bg-zinc-50"
            onClick={() => alert('Calling driver (demo)')}
          >
            <Phone size={17} /> Call
          </button>
          <button
            type="button"
            className="flex-1 h-11 rounded-2xl bg-[#0A7CFF] text-white font-medium flex items-center justify-center gap-2 active:bg-[#0066CC]"
            onClick={() => alert('Message opened (demo)')}
          >
            Message
          </button>
        </div>
      </div>

      {/* Stylized route preview */}
      <div className="mx-4 mt-4 bg-white rounded-3xl p-4 border border-[#E5E5EA] flex-1 relative overflow-hidden min-h-[140px]">
        <div className="text-xs uppercase tracking-[1px] text-[#8E8E93] mb-3 px-1">Trip</div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-[#34C759] mt-1.5 flex-shrink-0" />
            <div className="text-sm leading-tight">{activeRide.from}</div>
          </div>
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-[#FF3B30] mt-1.5 flex-shrink-0" />
            <div className="text-sm leading-tight">{activeRide.to}</div>
          </div>
        </div>

        {/* Simple animated route */}
        <div className="absolute bottom-4 right-4 w-28 h-20 opacity-70">
          <svg viewBox="0 0 100 70" className="w-full h-full">
            <motion.path
              d="M10 55 Q 40 25, 70 35 Q 85 42, 92 18"
              fill="none"
              stroke="#0A7CFF"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0.3 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.g
              animate={{ x: [0, 55, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="15" cy="52" r="4" fill="#111" />
              <text x="15" y="55" fontSize="7" fill="white" textAnchor="middle">🚕</text>
            </motion.g>
          </svg>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 bg-white border-t border-[#E5E5EA] mt-auto">
        <button
          type="button"
          onClick={handleCompleteRide}
          disabled={isCompleting}
          className="btn btn-primary w-full h-14 text-[17px] font-semibold disabled:opacity-70"
        >
          {isCompleting ? 'Completing ride…' : 'End ride & rate'}
        </button>
        <div className="text-center text-[10px] text-[#8E8E93] mt-2.5">Thank you for riding with CARGO</div>
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40" onClick={() => setShowCancelModal(false)}>
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="bg-white w-full max-w-[375px] rounded-t-3xl p-5 pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="font-semibold text-xl">Cancel ride?</div>
                <button type="button" onClick={() => setShowCancelModal(false)} className="p-1">
                  <X size={22} />
                </button>
              </div>
              <div className="text-[#6C6C6E] text-sm leading-snug mb-6">
                You may be charged a small cancellation fee if the driver is already on the way.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 h-12 rounded-2xl border border-[#E5E5EA] font-medium"
                >
                  Keep ride
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 h-12 rounded-2xl bg-[#FF3B30] text-white font-semibold disabled:opacity-70"
                >
                  {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
