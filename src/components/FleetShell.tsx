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
  Users,
  Wrench,
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

  const username = user?.name || 'User';
  const userRoleLabel = user?.role || role;

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

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111113] border-r border-[#1f1f23] flex flex-col justify-between h-screen sticky top-0 z-50 shrink-0">
        <div className="flex flex-col pt-6 px-4">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/20">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white leading-tight">TransitOps</h2>
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
                      ? 'bg-orange-500/10 border-orange-500 text-white font-bold'
                      : 'border-transparent text-[#8f9099] hover:bg-[var(--border)]/10 hover:text-white'
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
        <div className="p-4 border-t border-[#1f1f23] space-y-3 bg-[#0a0a0b]/60">
          <div className="px-2">
            <p className="text-[10px] text-[#5c5d64] font-medium tracking-wide">Signed in as</p>
            <p className="font-bold text-sm text-white leading-tight mt-0.5">{username}</p>
            <p className="text-[9px] font-bold tracking-wider text-orange-500/80 uppercase mt-0.5">{userRoleLabel}</p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="w-full justify-center gap-2 border-[#1f1f23] hover:bg-[#1f1f23] hover:text-white rounded-xl py-2 text-xs font-semibold text-gray-400"
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
