import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export function SplashScreen() {
  const navigate = useNavigate();
  const { isOnboarded } = useAppStore();

  useEffect(() => {
    // Auto-advance after 2.2s like many Figma prototypes
    const timer = setTimeout(() => {
      if (isOnboarded) {
        navigate('/home', { replace: true });
      } else {
        navigate('/signup', { replace: true });
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isOnboarded, navigate]);

  return (
    <div className="screen flex flex-col items-center justify-center bg-[#0F172A] text-white relative">
      {/* Logo area - centered large CARGO branding (exact from Figma splash) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-[#0A7CFF] flex items-center justify-center mb-6">
          <span className="text-white text-5xl font-bold tracking-[-2.5px]">C</span>
        </div>

        <div className="text-4xl font-semibold tracking-[-1.5px]">CARGO</div>
        <div className="text-sm text-white/50 mt-1 tracking-[3px] font-medium">
          RIDE • SHARE • GO
        </div>
      </motion.div>

      {/* Subtle loading indicator */}
      <div className="absolute bottom-24 text-[10px] tracking-[2px] text-white/40 font-mono">
        LOADING YOUR RIDE
      </div>
    </div>
  );
}
