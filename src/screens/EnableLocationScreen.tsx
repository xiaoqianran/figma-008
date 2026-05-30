import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

/**
 * Figma screen 8: Enable Location
 * Simple, clean permission-style screen with primary CTA.
 */
export function EnableLocationScreen() {
  const navigate = useNavigate()
  const { setOnboarded } = useAppStore()

  const handleEnable = () => {
    // In a real app this would call navigator.geolocation
    // For replica fidelity we just simulate success instantly
    setOnboarded(true)
    navigate('/home', { replace: true })
  }

  const handleSkip = () => {
    setOnboarded(true)
    navigate('/home', { replace: true })
  }

  return (
    <div className="screen flex flex-col bg-white px-4 text-black">
      <div className="flex-1 flex flex-col items-center justify-center text-center pt-12">
        <div className="w-20 h-20 rounded-2xl bg-[#E8F0FE] flex items-center justify-center mb-8">
          <MapPin size={42} className="text-[#0A7CFF]" />
        </div>

        <div className="text-[28px] leading-none font-semibold tracking-[-1px]">Enable location</div>
        <p className="mt-3 max-w-[300px] text-[#6C6C6E] text-[15px]">
          We need your location to show nearby drivers and give accurate ETAs for your rides.
        </p>
      </div>

      <div className="pb-10 space-y-3">
        <button
          onClick={handleEnable}
          className="btn btn-primary w-full text-[17px] font-semibold h-[60px]"
        >
          Enable location services
        </button>

        <button
          onClick={handleSkip}
          className="w-full text-[#0A7CFF] text-[15px] font-medium py-3 active:opacity-70"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
