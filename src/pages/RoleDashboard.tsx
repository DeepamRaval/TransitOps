import { useState } from 'react';
import {
  LogOut, Truck, LayoutDashboard, Navigation, Wrench, Moon, Sun, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { type TransitOpsRole } from '../types/auth';
import { Trips } from './owner/Trips';
import { Maintenance } from './owner/Maintenance';
import { useTheme } from '../contexts/ThemeContext';

const ROLE_COPY: Record<TransitOpsRole, { title: string; subtitle: string }> = {
  'Fleet Manager': {
    title: 'Fleet Command Center',
    subtitle: 'Manage vehicles, dispatch readiness, and fleet utilization.',
  },
  Driver: {
    title: 'Driver Workspace',
    subtitle: 'View assigned trips, update delivery status, and stay on route.',
  },
  'Safety Officer': {
    title: 'Safety & Compliance',
    subtitle: 'Monitor license validity, safety scores, and driver compliance.',
  },
  'Financial Analyst': {
    title: 'Finance & Analytics',
    subtitle: 'Track operational costs, fuel spend, maintenance, and ROI.',
  },
};

const welcomeCardStyle = 'bg-[var(--card)] border border-[var(--border)] p-10 rounded-2xl shadow-sm transition-all duration-300';
const subCardStyle = 'rounded-xl border border-[var(--border)] p-5 bg-[var(--card)] text-[var(--text)]';

export function RoleDashboard({ role }: { role: TransitOpsRole }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const copy = ROLE_COPY[role];
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trips' | 'maintenance'>('dashboard');

  // Define tab navigation links based on role
  const getNavLinks = () => {
    const links = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    if (role === 'Fleet Manager') {
      links.push({ id: 'trips', label: 'Trips', icon: Navigation });
      links.push({ id: 'maintenance', label: 'Maintenance', icon: Wrench });
    } else if (role === 'Driver') {
      links.push({ id: 'trips', label: 'My Trips', icon: Navigation });
    }
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex">
      {/* Left Sidebar Panel */}
      <aside className="w-64 fixed left-0 top-0 h-full z-40 bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-colors duration-300">
        <div className="flex items-center gap-3 p-6 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Truck size={22} className="text-[var(--primary)]" />
          </div>
          <div>
            <p className="font-bold tracking-tight text-lg text-[var(--text)] font-heading">TransitOps</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] font-mono">{role}</p>
          </div>
        </div>

        {/* Navigation Tab Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'gradient-bg text-white shadow-sm font-semibold'
                    : 'text-[var(--text-muted)] hover:bg-[var(--border)]/30 hover:text-[var(--text)]'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-[var(--border)] space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--border)]/30 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Right Content Panel */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top bar header */}
        <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="font-bold text-[var(--text)] capitalize">
              {activeTab === 'dashboard' ? 'Overview' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] px-4 py-1.5 rounded-full shadow-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              <div className="text-right">
                <p className="text-xs font-semibold leading-tight">{user?.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-none">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div className={welcomeCardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)] mb-3">Authenticated Session</p>
              <h1 className="text-4xl font-black tracking-tight mb-3">{copy.title}</h1>
              <p className="text-[var(--text-muted)] max-w-2xl mb-8">{copy.subtitle}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className={subCardStyle}>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Signed in as</p>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
                </div>
                <div className={subCardStyle}>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Role Type</p>
                  <p className="font-semibold">{role}</p>
                  <p className="text-sm text-[var(--text-muted)]">RBAC session active via JWT</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trips' && <Trips cardTheme="cyberpunk" />}
          {activeTab === 'maintenance' && <Maintenance cardTheme="cyberpunk" />}
        </main>
      </div>
    </div>
  );
}
