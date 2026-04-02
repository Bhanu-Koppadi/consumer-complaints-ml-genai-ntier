import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { registerUser } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw: string): null | 'weak' | 'fair' | 'good' | 'strong' {
  if (!pw) return null;
  if (pw.length < 6) return 'weak';
  if (pw.length < MIN_PASSWORD_LENGTH) return 'fair';
  if (pw.length >= 12 && /[!@#$%^&*0-9]/.test(pw)) return 'strong';
  return 'good';
}

const STRENGTH_META = {
  weak: { label: 'Weak', color: '#ef4444', width: '25%' },
  fair: { label: 'Fair', color: '#f59e0b', width: '50%' },
  good: { label: 'Good', color: '#3b82f6', width: '75%' },
  strong: { label: 'Strong', color: '#10b981', width: '100%' },
};

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  function validate(): string | null {
    if (!username.trim()) return 'Username is required.';
    if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!email.trim()) return 'Email address is required.';
    if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
    if (password.length < MIN_PASSWORD_LENGTH)
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);
    const vError = validate();
    if (vError) { setValidationError(vError); return; }
    const result = await dispatch(registerUser({ username: username.trim(), email: email.trim(), password }));
    if (registerUser.fulfilled.match(result)) navigate('/submit');
  }

  const strength = getPasswordStrength(password);
  const pwMatch = confirmPassword.length > 0 && password === confirmPassword;
  const pwNoMatch = confirmPassword.length > 0 && password !== confirmPassword;
  const displayError = validationError ?? error;

  const inputBase =
    'w-full py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all';

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

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          >
            CC
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Consumer Complaints AI</span>
        </div>

        {/* Headline — vertically centered in remaining space */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
            style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.2)' }}
          >
            <BrainCircuit size={28} style={{ color: '#2dd4bf' }} />
          </div>
          <h2 className="text-3xl font-extrabold leading-tight mb-3 text-white">
            Join the Future of<br />Complaint Resolution
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Get instant AI-powered classification, confidence scoring, and transparent explanations for every complaint.
          </p>
        </div>

      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white overflow-y-auto animate-slide-in-right delay-100">
        <div className="w-full max-w-sm">

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

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create an account</h1>
          <p className="text-slate-500 text-sm mb-8">Register to submit and track consumer complaints.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setValidationError(null); }}
                  autoComplete="username"
                  className={`${inputBase} pl-10 pr-4`}
                  placeholder="Choose a username (min 3 chars)"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setValidationError(null); }}
                  autoComplete="email"
                  className={`${inputBase} pl-10 pr-4`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
                  autoComplete="new-password"
                  className={`${inputBase} pl-10 pr-11`}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-400"
                      style={{ width: STRENGTH_META[strength].width, background: STRENGTH_META[strength].color }}
                    />
                  </div>
                  <p className="text-xs mt-1 font-medium" style={{ color: STRENGTH_META[strength].color }}>
                    Strength: {STRENGTH_META[strength].label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-confirm"
                  type={showCpw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                  autoComplete="new-password"
                  className={`${inputBase} pl-10 pr-11`}
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowCpw(!showCpw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwMatch && (
                <p className="flex items-center gap-1 text-xs mt-1 font-medium text-emerald-600">
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
              {pwNoMatch && (
                <p className="flex items-center gap-1 text-xs mt-1 font-medium text-red-500">
                  <XCircle size={12} /> Passwords do not match
                </p>
              )}
            </div>

            {displayError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span>{displayError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Creating account…</>
              ) : 'Create account'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold hover:opacity-80 transition-opacity" style={{ color: '#0d9488' }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
