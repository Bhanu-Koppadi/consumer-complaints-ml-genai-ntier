import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Brain, LogOut, LayoutDashboard, FileText, History, ShieldCheck } from 'lucide-react';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

interface LayoutProps { children: ReactNode }

export function Layout({ children }: LayoutProps) {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const isAdmin    = user?.role === 'ADMIN';
  const initial    = user?.username?.charAt(0).toUpperCase() ?? '?';

  function handleLogout() { dispatch(logout()); navigate('/'); }

  const activeLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-teal-50 text-teal-700 font-semibold'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold transition-opacity group-hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
              >
                CC
              </div>
              <span className="font-bold text-slate-800 text-sm hidden sm:block tracking-tight">
                Consumer Complaints&nbsp;<span style={{ color: '#0d9488' }}>AI</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {!isAdmin && (
                <>
                  <NavLink to="/submit"  className={activeLink}>
                    <FileText size={14} /> Submit
                  </NavLink>
                  <NavLink to="/history" className={activeLink}>
                    <History size={14} /> History
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink to="/admin" className={activeLink}>
                  <LayoutDashboard size={14} /> Admin Dashboard
                </NavLink>
              )}
            </nav>
          </div>

              {isAuthenticated && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #115e59)' }}
                >
                  {initial}
                </div>
                <span className="text-sm text-slate-700 font-medium hidden sm:block">{user?.username}</span>
                {isAdmin && (
                  <ShieldCheck size={13} style={{ color: '#0d9488' }} className="ml-0.5" />
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all duration-150"
                aria-label="Logout"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-5 py-8">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={14} style={{ color: '#0d9488' }} />
            <span className="text-xs text-slate-500 font-medium">Consumer Complaints ML + GenAI System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
