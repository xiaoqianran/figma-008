import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';

export function SignUpScreen() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [name, setName] = useState('Alex Rivera');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    // Simulate network + OTP step
    await new Promise((r) => setTimeout(r, 650));

    setUser({
      id: 'u_' + Date.now(),
      name,
      phone,
    });
    navigate('/verify');
  };

  return (
    <div className="screen overflow-y-auto bg-white px-4 pb-12 text-black">
      {/* Status bar already in frame */}

      <div className="pt-12">
        <div className="text-[28px] leading-none font-semibold tracking-[-1px]">Create account</div>
        <p className="mt-2 text-[#6C6C6E] text-[15px]">
          Join the largest car sharing network in the city.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {/* Name */}
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8E8E93] mb-1.5 pl-1">
            FULL NAME
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your full name"
          />
        </div>

        {/* Phone (Figma style) */}
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8E8E93] mb-1.5 pl-1">
            PHONE NUMBER
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* Country picker hint (matches Figma screen 4) */}
        <button
          onClick={() => toast('Country selector', { description: 'Figma screen 4 (demo)' })}
          className="text-xs text-[#0A7CFF] flex items-center gap-1 active:opacity-60"
        >
          United States +1 ▾
        </button>
      </div>

      <div className="mt-8">
        <button
          onClick={handleSignUp}
          disabled={loading || !name || !phone}
          className="btn btn-primary w-full text-[17px] font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Continue with Phone'}
        </button>
      </div>

      <div className="my-6 flex items-center gap-4 text-[#8E8E93] text-xs">
        <div className="flex-1 h-px bg-[#E5E5EA]" />
        OR
        <div className="flex-1 h-px bg-[#E5E5EA]" />
      </div>

      {/* Social buttons (exact Figma layout) */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn btn-social text-sm font-medium">Facebook</button>
        <button className="btn btn-social twitter text-sm font-medium">Twitter</button>
      </div>

      <div className="mt-8 text-center text-xs text-[#8E8E93]">
        By continuing you agree to our <span className="text-[#0A7CFF]">Terms</span> &amp;{' '}
        <span className="text-[#0A7CFF]">Privacy</span>.
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/login')}
          className="text-[#0A7CFF] text-sm font-medium active:underline"
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}
