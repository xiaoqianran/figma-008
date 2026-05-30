import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RideType = 'economy' | 'comfort' | 'premium' | 'xl'

export interface BookingState {
  pickupLocation: string
  destinationLocation: string
  pickupTime: string // ISO or "Now"
  rideType: RideType | null
  estimatedPrice: number
  promoCode: string | null
  paymentMethod: 'card' | 'paypal' | 'cash' | null
  cardLast4?: string
  // Map-enhanced: real lat/lng for interactive destination picker
  pickupCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
}

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  avatarUrl?: string
}

interface AppState {
  // Auth / Onboarding
  isOnboarded: boolean
  user: User | null
  
  // Current booking flow (persisted across screens)
  booking: BookingState
  
  // History of completed rides (demo)
  rideHistory: Array<{
    id: string
    date: string
    from: string
    to: string
    price: number
    driver: string
    rating: number
  }>

  // Actions
  setOnboarded: (value: boolean) => void
  setUser: (user: User) => void
  updateBooking: (patch: Partial<BookingState>) => void
  resetBooking: () => void
  completeRide: (ride: AppState['rideHistory'][0]) => void
  logout: () => void
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      user: null,
      booking: initialBooking,
      rideHistory: [],

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
    }),
    {
      name: 'cargo-app-storage',
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        user: state.user,
        rideHistory: state.rideHistory,
      }),
    }
  )
)
