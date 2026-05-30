import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export function HomeScreen() {
  const navigate = useNavigate()
  const { user, booking, updateBooking } = useAppStore()

  const quickActions = [
    { label: 'Set destination', icon: MapPin, action: () => navigate('/destination') },
    { label: 'Schedule later', icon: Clock, action: () => {
      updateBooking({ pickupTime: 'Tomorrow 09:15' })
      navigate('/destination')
    }},
  ]

  return (
    <div className="screen overflow-y-auto pb-20 bg-[#F8F9FA] text-black">
      {/* Greeting header (Figma style) */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8E8E93]">Good morning</div>
            <div className="text-2xl font-semibold tracking-[-0.5px]">{user?.name?.split(' ')[0] || 'Rider'}</div>
          </div>
          <div className="w-9 h-9 bg-zinc-200 rounded-full overflow-hidden ring-2 ring-white">
            {/* Avatar placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-[#0A7CFF] to-[#0059CC] flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </div>
      </div>

      {/* Hero / Map area (Figma Home has prominent map or location card) */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-[#E5E5EA] bg-white shadow-sm h-[260px] relative">
        {/* Placeholder for real MapLibre – high visual fidelity for now */}
        <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:28px_28px] opacity-60" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="text-5xl mb-3 opacity-90">🗺️</div>
          <div className="font-semibold text-lg">Your location</div>
          <div className="text-sm text-[#6C6C6E] mt-0.5">{booking.pickupLocation}</div>
          
          <button 
            onClick={() => navigate('/destination')}
            className="mt-6 btn btn-primary px-8 text-sm font-semibold shadow-md"
          >
            Where to? <ArrowRight className="ml-2" size={16} />
          </button>
        </div>

        {/* Floating current location pill */}
        <div className="absolute top-4 right-4 bg-white shadow px-3 py-1 rounded-full text-xs flex items-center gap-1.5 border">
          <div className="w-2 h-2 bg-[#34C759] rounded-full animate-pulse" /> Live
        </div>
      </div>

      {/* Quick actions row */}
      <div className="px-4 mt-5">
        <div className="text-xs uppercase tracking-[1px] text-[#8E8E93] mb-2 pl-1">QUICK BOOK</div>
        <div className="flex gap-3">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon
            return (
              <button 
                key={i}
                onClick={qa.action}
                className="flex-1 bg-white border border-[#E5E5EA] active:bg-zinc-50 rounded-2xl p-4 flex flex-col items-start text-left"
              >
                <Icon size={22} className="text-[#0A7CFF] mb-3" />
                <div className="font-medium text-sm leading-tight">{qa.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Suggested rides / promo teaser (from Figma components) */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs uppercase tracking-[1px] text-[#8E8E93]">SUGGESTED FOR YOU</div>
          <button onClick={() => navigate('/destination')} className="text-xs text-[#0A7CFF]">See all</button>
        </div>

        <div onClick={() => navigate('/destination')} className="ride-card card p-4 flex gap-4 active:scale-[0.985] cursor-pointer">
          <div className="w-16 h-16 bg-zinc-100 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Economy • 4 min away</div>
            <div className="text-sm text-[#6C6C6E] mt-px">Tesla Model 3 • 3 seats</div>
            <div className="mt-2 text-lg font-semibold tracking-tight">$8.40</div>
          </div>
          <div className="text-right text-xs text-[#8E8E93] pt-1">2 min</div>
        </div>
      </div>

      {/* Recent activity teaser */}
      <div className="px-4 mt-8 pb-4 text-xs text-[#8E8E93]">
        Last ride • Downtown → Airport • 2 days ago
      </div>
    </div>
  )
}
