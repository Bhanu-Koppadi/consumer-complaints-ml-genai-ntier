import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
} from 'lucide-react';
import { loginUser } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const FEATURES = [
  { icon: Zap, label: 'Instant AI Classification' },
  { icon: BarChart3, label: 'Confidence Scoring' },
  { icon: ShieldCheck, label: 'Secure Role-Based Access' },
];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate(result.payload.user.role === 'ADMIN' ? '/admin' : '/submit');
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div
        className="hidden md:flex md:w-[42%] flex-col p-10 text-white relative overflow-hidden animate-slide-in-left"
        style={{ background: 'linear-gradient(160deg, #0c1a2e 0%, #0f2537 60%, #0a1f32 100%)' }}
      >
        {/* Subtle top glow only */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-8 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0d9488, transparent 65%)' }}
        />

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          >
            CC
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Consumer Complaints AI</span>
        </div>

        {/* Center: Headline — vertically centered in remaining space */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
            style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.2)' }}
          >
            <BrainCircuit size={28} style={{ color: '#2dd4bf' }} />
          </div>
          <h2 className="text-3xl font-extrabold leading-tight mb-3 text-white">
            AI-Powered Complaint<br />Intelligence Platform
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Instantly classify, explain, and route consumer complaints with machine learning and generative AI.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-slate-300">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(13,148,136,0.18)', border: '1px solid rgba(13,148,136,0.25)' }}
                >
                  <Icon size={14} style={{ color: '#2dd4bf' }} />
                </div>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white animate-slide-in-right delay-100">
        <div className="w-full max-w-sm animate-scale-in delay-200">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
            >
              CC
            </div>
            <span className="font-semibold text-slate-800 text-sm">Consumer Complaints AI</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-8">Access your Consumer Complaints AI account.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': '#0d9488' } as React.CSSProperties}
                  placeholder="Your username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold hover:opacity-80 transition-opacity" style={{ color: '#0d9488' }}>
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
