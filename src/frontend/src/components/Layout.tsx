import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

interface LayoutProps {
  children: ReactNode;
}

const activeNavClass =
  'bg-primary-50 text-primary-700 rounded-md px-3 py-2 text-sm font-medium';
const inactiveNavClass =
  'text-slate-600 hover:bg-slate-100 rounded-md px-3 py-2 text-sm font-medium';

const activeMobileNavClass =
  'bg-primary-50 text-primary-700 rounded text-sm px-3 py-1';
const inactiveMobileNavClass =
  'text-slate-600 hover:bg-slate-100 rounded text-sm px-3 py-1';

export function Layout({ children }: LayoutProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  function handleLogout() {
    dispatch(logout());
    navigate('/');
  }

  const isAdmin = user?.role === 'ADMIN';
  const avatarInitial = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky header + mobile nav */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo + Desktop nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold select-none">
                CC
              </span>
              <span className="text-slate-800 font-semibold text-sm leading-tight hidden sm:block">
                Consumer Complaints AI
              </span>
            </Link>

            {/* Desktop nav links: Submit/History for users; Admin only for admins (management-only nav for admin) */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
              {!isAdmin && (
                <>
                  <NavLink
                    to="/submit"
                    className={({ isActive }) =>
                      isActive ? activeNavClass : inactiveNavClass
                    }
                  >
                    Submit
                  </NavLink>
                  <NavLink
                    to="/history"
                    className={({ isActive }) =>
                      isActive ? activeNavClass : inactiveNavClass
                    }
                  >
                    History
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? activeNavClass : inactiveNavClass
                  }
                >
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right: User avatar + name + Logout */}
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold select-none">
                {avatarInitial}
              </span>
              <span className="text-sm text-slate-700 font-medium hidden sm:block">
                {user?.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile nav strip */}
      <div className="md:hidden border-b border-slate-200">
        <nav aria-label="Mobile navigation" className="max-w-7xl mx-auto px-4 flex gap-2 py-2 overflow-x-auto">
          {!isAdmin && (
            <>
              <NavLink
                to="/submit"
                className={({ isActive }) =>
                  isActive ? activeMobileNavClass : inactiveMobileNavClass
                }
              >
                Submit
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  isActive ? activeMobileNavClass : inactiveMobileNavClass
                }
              >
                History
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? activeMobileNavClass : inactiveMobileNavClass
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
      </div>
      </div>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-700 text-slate-300 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <span>Consumer Complaints ML + GenAI System</span>
          <span>&copy; 2026 Srivari SSPL</span>
        </div>
      </footer>
    </div>
  );
}
