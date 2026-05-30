import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'

export function LoginScreen() {
  const navigate = useNavigate()
  const { setUser } = useAppStore()
  const [phone, setPhone] = useState('+1 (555) 987-6543')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 480))
    setUser({
      id: 'u_demo',
      name: 'Alex Rivera',
      phone,
    })
    navigate('/location')
  }

  return (
    <div className="screen overflow-y-auto bg-white px-4 pb-12 text-black">
      <div className="pt-12">
        <div className="text-[28px] leading-none font-semibold tracking-[-1px]">Welcome back</div>
        <p className="mt-2 text-[#6C6C6E] text-[15px]">Log in to continue your rides.</p>
      </div>

      <div className="mt-8">
        <div className="text-xs uppercase tracking-widest text-[#8E8E93] mb-1.5 pl-1">PHONE NUMBER</div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
        />
      </div>

      <button 
        onClick={handleLogin}
        disabled={loading}
        className="btn btn-primary w-full mt-6 text-[17px] font-semibold"
      >
        {loading ? 'Signing in…' : 'Log in'}
      </button>

      <div className="mt-4 text-center">
        <button onClick={() => navigate('/signup')} className="text-[#0A7CFF] text-sm">No account? Sign up</button>
      </div>

      <div className="mt-8 text-[11px] text-center text-[#8E8E93]">
        Forgot your password? <button onClick={() => alert('Forgot password flow matches Figma screen 6')} className="underline text-[#0A7CFF]">Reset here</button>
      </div>
    </div>
  )
}
