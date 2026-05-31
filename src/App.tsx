import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Clock, Heart, Home, MapPin, User } from 'lucide-react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { ActivityScreen } from './screens/ActivityScreen';
import { AddPlaceScreen } from './screens/AddPlaceScreen';
import { DestinationScreen } from './screens/DestinationScreen';
import { EnableLocationScreen } from './screens/EnableLocationScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RideTrackingScreen } from './screens/RideTrackingScreen';
import { SelectServiceScreen } from './screens/SelectServiceScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SplashScreen } from './screens/SplashScreen';
import { VerifyPhoneScreen } from './screens/VerifyPhoneScreen';
import { useAppStore } from './stores/useAppStore';

// Central device preview wrapper – this gives the exact "Figma prototype" viewing experience
function DeviceFrame({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.pathname !== '/' && location.pathname !== '/splash';

  return (
    <div className="min-h-screen bg-[#111113] flex items-center justify-center p-8">
      <div className="device-frame">
        <div className="app-viewport bg-[#F8F9FA] relative overflow-hidden">
          {/* Top status bar (iOS style - black on light screens) */}
          <div className="status-bar text-black z-50 relative">
            <div>9:41</div>
            <div className="flex items-center gap-1 text-[12px]">
              <span>100%</span>
              {/* Simple signal + wifi + battery icons via text for now */}
              <span>●●●</span>
            </div>
          </div>

          {/* Main content area with safe area + transitions */}
          <div className="relative h-[calc(100%-44px-34px)] overflow-hidden">
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </div>

          {/* Bottom home indicator area (visual only) */}
          <div className="h-[34px] flex items-end justify-center pb-2 z-50">
            <div className="w-[134px] h-1 bg-black/80 rounded-full" />
          </div>

          {/* Dev helper: back button overlay when not on splash */}
          {canGoBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute top-[60px] left-4 z-[100] bg-white/90 backdrop-blur rounded-full p-2 shadow-md active:scale-95"
              aria-label="Go back"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop info panel */}
      <div className="ml-8 max-w-xs hidden lg:block text-white/70 text-sm leading-relaxed">
        <div className="font-semibold text-white mb-2 text-base">CARGO Figma Replica</div>
        <p>
          Exact 1:1 replication of the "CARGO - Car Booking &amp; Sharing App" design system from
          Figma.
        </p>
        <p className="mt-3 text-xs opacity-60">
          375×812 • iPhone X frame • All flows interactive • PWA ready
        </p>
        <div className="mt-6 text-[10px] font-mono opacity-50">
          Press F12 → Toggle device toolbar for real mobile test
        </div>
      </div>
    </div>
  );
}

// Bottom tab bar with premium spring-animated sliding pill indicator
export function MainTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/destination', label: 'Explore', icon: MapPin },
    { path: '/favorites', label: 'Favorites', icon: Heart },
    { path: '/activity', label: 'Activity', icon: Clock },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const active = tabs.findIndex((t) => location.pathname.startsWith(t.path));
  const activeSafe = active === -1 ? 0 : active;
  const pillLeft = `${(activeSafe / tabs.length) * 100}%`;
  const pillWidth = `${(1 / tabs.length) * 100}%`;

  return (
    <div className="tab-bar absolute bottom-0 left-0 right-0 h-14 flex items-center justify-around z-50 border-t border-[#E5E5EA] bg-white/95 backdrop-blur-xl">
      {/* Sliding active pill - spring animated for premium feel */}
      <motion.div
        className="absolute top-1 bottom-1 bg-[#0A7CFF]/10 rounded-2xl z-0"
        style={{ left: pillLeft, width: pillWidth }}
        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
        layoutId="tab-active-pill"
      />

      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = idx === active;
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(6);
              navigate(tab.path);
            }}
            className={`relative flex flex-col items-center justify-center text-xs z-10 transition-colors ${isActive ? 'text-[#0A7CFF]' : 'text-[#8E8E93]'}`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="mt-px">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Root layout
export default function App() {
  const location = useLocation();
  useAppStore(); // isOnboarded accessed in future conditional logic for protected flows

  // For prototype feel: if user hasn't completed onboarding in this session, force splash/login flow
  // (variable reserved for future conditional rendering of tab bar / protected routes)

  return (
    <DeviceFrame>
      <Routes location={location}>
        {/* Auth / Onboarding flow (no tabs) */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Full Figma onboarding sequence (screens 7 & 8) */}
        <Route path="/verify" element={<VerifyPhoneScreen />} />
        <Route path="/location" element={<EnableLocationScreen />} />

        {/* Main authenticated app */}
        <Route
          path="/home"
          element={
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="screen bg-[#F8F9FA]"
            >
              <HomeScreen />
              <MainTabBar />
            </motion.div>
          }
        />

        <Route
          path="/destination"
          element={
            <div className="screen bg-white">
              <DestinationScreen />
              <MainTabBar />
            </div>
          }
        />

        <Route
          path="/service"
          element={
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="screen bg-white"
            >
              <SelectServiceScreen />
            </motion.div>
          }
        />
        <Route
          path="/payment"
          element={
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="screen bg-white"
            >
              <PaymentScreen />
            </motion.div>
          }
        />

        <Route
          path="/tracking"
          element={
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="screen bg-[#F8F9FA]"
            >
              <RideTrackingScreen />
            </motion.div>
          }
        />

        {/* Placeholder routes for remaining flows (implemented in later phases) */}
        <Route path="/favorites" element={<FavoritesScreen />} />
        <Route path="/add-place" element={<AddPlaceScreen />} />
        <Route path="/activity" element={<ActivityScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />

        {/* Fallback */}
        <Route path="*" element={<SplashScreen />} />
      </Routes>
    </DeviceFrame>
  );
}
