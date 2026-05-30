import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'

/**
 * Figma screen 7: Verify phone number (OTP 4 boxes)
 * Exact match to the Figma design: 4 large 70px square inputs, primary CTA below.
 */
export function VerifyPhoneScreen() {
  const navigate = useNavigate()
  const { setUser, user } = useAppStore()
  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)

  const updateDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...code]
    next[index] = value
    setCode(next)

    // Auto-advance
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
      nextInput?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 4) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 650))

    // Complete onboarding
    if (!user) {
      setUser({
        id: 'u_' + Date.now(),
        name: 'Alex Rivera',
        phone: '+1 (555) 123-4567',
      })
    }
    navigate('/location')
  }

  const isComplete = code.every(d => d.length === 1)

  return (
    <div className="screen overflow-y-auto bg-white px-4 pb-12 text-black">
      <div className="pt-12">
        <div className="text-[28px] leading-none font-semibold tracking-[-1px]">Verify phone number</div>
        <p className="mt-2 text-[#6C6C6E] text-[15px]">
          We sent a 4-digit code to <span className="font-medium text-black">+1 (555) 123-4567</span>
        </p>
      </div>

      {/* 4 OTP boxes - pixel matched to Figma 70×70 */}
      <div className="flex gap-4 mt-8 justify-center">
        {code.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !code[i] && i > 0) {
                const prev = document.getElementById(`otp-${i - 1}`) as HTMLInputElement
                prev?.focus()
              }
            }}
            className="w-[70px] h-[70px] text-center text-3xl font-semibold border border-[#E5E5EA] rounded-2xl focus:border-[#0A7CFF] focus:outline-none"
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={!isComplete || loading}
        className="btn btn-primary w-full mt-8 text-[17px] font-semibold disabled:opacity-60"
      >
        {loading ? 'Verifying…' : 'Verify'}
      </button>

      <div className="mt-6 text-center">
        <button onClick={() => alert('Resend code (demo)')} className="text-[#0A7CFF] text-sm font-medium">
          Didn’t receive a code? Resend
        </button>
      </div>
    </div>
  )
}
