import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Fuel,
  LayoutGrid,
  LogOut,
  Moon,
  Route,
  Settings,
  Sun,
  Truck,
  UserCircle,
  Users,
  Wrench,
  X,
  Mail,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import type { TransitOpsRole } from '../types/auth';

interface FleetShellProps {
  children: React.ReactNode;
  role: TransitOpsRole;
}

export function FleetShell({ children, role }: FleetShellProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const username = user?.name || 'User';
  const userRoleLabel = user?.role || role;
  const userEmail = user?.email || '';

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  // Close popup on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false);
    }
    if (profileOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [profileOpen]);

  const dashboardPath =
    role === 'Fleet Manager'
      ? '/fleet'
      : role === 'Safety Officer'
      ? '/safety'
      : role === 'Financial Analyst'
      ? '/finance'
      : '/driver';

  const driverPath = role === 'Safety Officer' ? '/safety/drivers' : '/fleet/drivers';

  const getSidebarLinks = () => {
    if (role === 'Driver') {
      return [
        { to: dashboardPath, label: 'Dashboard', icon: LayoutGrid },
        { to: '/fleet/settings', label: 'Settings', icon: Settings },
      ];
    }

    return [
      { to: dashboardPath, label: 'Dashboard', icon: LayoutGrid },
      { to: '/fleet/vehicles', label: 'Fleet', icon: Truck },
      { to: driverPath, label: 'Drivers', icon: Users },
      { to: '/fleet/trips', label: 'Trips', icon: Route },
      { to: '/fleet/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/fleet/expenses', label: 'Fuel & Expenses', icon: Fuel },
      { to: '/fleet/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/fleet/settings', label: 'Settings', icon: Settings },
    ];
  };

  const links = getSidebarLinks();

  // Generate initials for avatar
  const initials = username
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Role color mapping
  const roleColor =
    userRoleLabel === 'Fleet Manager'
      ? 'from-orange-500 to-amber-600'
      : userRoleLabel === 'Driver'
      ? 'from-blue-500 to-cyan-500'
      : userRoleLabel === 'Safety Officer'
      ? 'from-emerald-500 to-teal-500'
      : 'from-violet-500 to-purple-500';

  const roleBgLight =
    userRoleLabel === 'Fleet Manager'
      ? 'bg-orange-500/10 text-orange-400'
      : userRoleLabel === 'Driver'
      ? 'bg-blue-500/10 text-blue-400'
      : userRoleLabel === 'Safety Officer'
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'bg-violet-500/10 text-violet-400';

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col justify-between h-screen sticky top-0 z-50 shrink-0 transition-colors duration-300">
        <div className="flex flex-col pt-6 px-4">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/20">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-[var(--text)] leading-tight">TransitOps</h2>
              <p className="text-[9px] tracking-[0.15em] font-bold text-orange-500 uppercase">Smart Ops</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active =
                to === dashboardPath
                  ? location.pathname === dashboardPath
                  : location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border-l-2 ${
                    active
                      ? 'bg-orange-500/10 border-orange-500 text-[var(--primary)] font-bold'
                      : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--border)]/35 hover:text-[var(--text)]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Profile */}
        <div className="p-4 border-t border-[var(--border)] space-y-3 bg-[var(--card)]/40 relative">
          <div className="px-2 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide">Signed in as</p>
              <p className="font-bold text-sm text-[var(--text)] leading-tight mt-0.5 truncate">{username}</p>
              <p className="text-[9px] font-bold tracking-wider text-orange-500/80 uppercase mt-0.5">{userRoleLabel}</p>
            </div>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-1.5 rounded-lg hover:bg-[var(--border)]/40 transition-all cursor-pointer group shrink-0 mt-1"
              title="View profile"
            >
              <UserCircle
                size={22}
                className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors"
              />
            </button>
          </div>

          {/* Profile Popup */}
          {profileOpen && (
            <div
              ref={popupRef}
              className="absolute bottom-full left-3 right-3 mb-2 z-[100] animate-fade-in"
            >
              <div className="rounded-2xl glass-card overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/50">
                {/* Header gradient strip */}
                <div className={`h-20 bg-gradient-to-r ${roleColor} relative`}>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                  >
                    <X size={14} className="text-white/80" />
                  </button>
                </div>

                {/* Avatar overlapping header */}
                <div className="flex justify-center -mt-8 relative z-10">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-lg font-black ring-4 ring-[var(--card)] shadow-lg`}>
                    {initials}
                  </div>
                </div>

                {/* Profile content */}
                <div className="px-5 pt-3 pb-5">
                  <div className="text-center mb-4">
                    <h3 className="text-[var(--text)] font-bold text-base">{username}</h3>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full ${roleBgLight}`}>
                      {userRoleLabel}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Email */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg)]/80 border border-[var(--border)]/40">
                      <Mail size={14} className="text-[var(--text-muted)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Email</p>
                        <p className="text-xs text-[var(--text)]/90 font-medium truncate">{userEmail}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg)]/80 border border-[var(--border)]/40">
                      <Shield size={14} className="text-[var(--text-muted)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Access Level</p>
                        <p className="text-xs text-[var(--text)]/90 font-medium">{userRoleLabel}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg)]/80 border border-[var(--border)]/40">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Status</p>
                        <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">Active Session</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={logout}
            className="w-full justify-center gap-2 border-[var(--border)] hover:bg-[var(--border)]/50 hover:text-[var(--text)] rounded-xl py-2 text-xs font-semibold text-[var(--text-muted)]"
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="py-4 px-8 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/40 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.25em] font-black text-[var(--text-muted)] uppercase">TransitOps</span>
            <span className="text-[10px] text-[var(--text-muted)]">/</span>
            <span className="text-[10px] tracking-[0.25em] font-black text-orange-500 uppercase">{username}</span>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)]/35 transition-all cursor-pointer bg-[var(--card)]"
          >
            {theme === 'light' ? (
              <>
                <Moon size={14} /> Dark
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-500" /> Light
              </>
            )}
          </button>
        </header>
        <main className="flex-1 p-8 overflow-y-auto bg-[var(--bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}

