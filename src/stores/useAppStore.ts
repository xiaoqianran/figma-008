import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RideType = 'economy' | 'comfort' | 'premium' | 'xl';

export interface BookingState {
  pickupLocation: string;
  destinationLocation: string;
  pickupTime: string; // ISO or "Now"
  rideType: RideType | null;
  estimatedPrice: number;
  promoCode: string | null;
  paymentMethod: 'card' | 'paypal' | 'cash' | null;
  cardLast4?: string;
  // Map-enhanced: real lat/lng for interactive destination picker
  pickupCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
}

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  coords?: { lat: number; lng: number };
}

export interface ActiveRide {
  id: string;
  driver: string;
  vehicle: string;
  etaMinutes: number;
  price: number;
  from: string;
  to: string;
  rideType: RideType;
  startedAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

interface AppState {
  // Auth / Onboarding
  isOnboarded: boolean;
  user: User | null;

  // Current booking flow (persisted across screens)
  booking: BookingState;

  // History of completed rides (demo)
  rideHistory: Array<{
    id: string;
    date: string;
    from: string;
    to: string;
    price: number;
    driver: string;
    rating: number;
    fromCoords?: { lat: number; lng: number };
    toCoords?: { lat: number; lng: number };
  }>;

  // User saved places (Favorites)
  favorites: SavedPlace[];

  // Active ride (for tracking after booking)
  activeRide: ActiveRide | null;

  // Actions
  setOnboarded: (value: boolean) => void;
  setUser: (user: User) => void;
  updateBooking: (patch: Partial<BookingState>) => void;
  resetBooking: () => void;
  completeRide: (ride: AppState['rideHistory'][0]) => void;
  logout: () => void;

  // Favorites actions
  addFavorite: (place: Omit<SavedPlace, 'id'>) => void;
  removeFavorite: (id: string) => void;

  // Active ride actions
  startRide: (ride: ActiveRide) => void;
  updateActiveRide: (patch: Partial<ActiveRide>) => void;
  cancelRide: () => void;
  completeActiveRide: () => void;
}

const initialBooking: BookingState = {
  pickupLocation: 'Current location',
  destinationLocation: '',
  pickupTime: 'Now',
  rideType: null,
  estimatedPrice: 0,
  promoCode: null,
  paymentMethod: null,
  // Coords populated by interactive MapLibre destination picker
  pickupCoords: undefined,
  destinationCoords: undefined,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      user: null,
      booking: initialBooking,
      rideHistory: [],
      favorites: [],
      activeRide: null,

      setOnboarded: (value) => set({ isOnboarded: value }),

      setUser: (user) => set({ user, isOnboarded: true }),

      updateBooking: (patch) =>
        set((state) => ({
          booking: { ...state.booking, ...patch },
        })),

      resetBooking: () => set({ booking: initialBooking }),

      completeRide: (ride) =>
        set((state) => ({
          rideHistory: [ride, ...state.rideHistory].slice(0, 20),
          booking: initialBooking,
        })),

      logout: () =>
        set({
          user: null,
          isOnboarded: false,
          booking: initialBooking,
        }),

      addFavorite: (place) =>
        set((state) => ({
          favorites: [
            ...state.favorites,
            { ...place, id: 'fav_' + Date.now() + Math.random().toString(36).slice(2) },
          ],
        })),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      startRide: (ride) => set({ activeRide: ride }),

      updateActiveRide: (patch) =>
        set((state) => ({
          activeRide: state.activeRide ? { ...state.activeRide, ...patch } : null,
        })),

      cancelRide: () => set({ activeRide: null }),

      completeActiveRide: () =>
        set((state) => {
          if (!state.activeRide) return state;

          const completed = {
            id: state.activeRide.id,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            from: state.activeRide.from,
            to: state.activeRide.to,
            price: state.activeRide.price,
            driver: state.activeRide.driver,
            rating: 4.9,
          };

          return {
            rideHistory: [completed, ...state.rideHistory].slice(0, 20),
            activeRide: null,
            booking: initialBooking,
          };
        }),
    }),
    {
      name: 'cargo-app-storage',
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        user: state.user,
        rideHistory: state.rideHistory,
        favorites: state.favorites,
        activeRide: state.activeRide,
      }),
    }
  )
);
