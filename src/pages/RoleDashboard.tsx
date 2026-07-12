import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { homePathForRole, type TransitOpsRole } from '../types/auth';
import { Trips } from './owner/Trips';
import { Maintenance } from './owner/Maintenance';

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

export function RoleDashboard({ role }: { role: TransitOpsRole }) {
  const { user, logout } = useAuth();
  const copy = ROLE_COPY[role];
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trips' | 'maintenance'>('dashboard');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
              <Truck size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="font-black tracking-tight">TransitOps</p>
              <p className="text-xs text-[var(--text-muted)]">{role}</p>
            </div>
          </div>

          {role === 'Fleet Manager' && (
            <div className="flex items-center gap-1 bg-[var(--border)]/30 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[var(--primary)] text-white shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('trips')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'trips'
                    ? 'bg-[var(--primary)] text-white shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Trips
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'maintenance'
                    ? 'bg-[var(--primary)] text-white shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Maintenance
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)] hidden sm:inline">{user?.email}</span>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {activeTab === 'dashboard' && (
          <div className="glass-card rounded-[2rem] p-10 border border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)] mb-3">Authenticated</p>
            <h1 className="text-4xl font-black tracking-tight mb-3">{copy.title}</h1>
            <p className="text-[var(--text-muted)] max-w-2xl mb-8">{copy.subtitle}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--border)] p-5 bg-[var(--card)]">
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Signed in as</p>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] p-5 bg-[var(--card)]">
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Role</p>
                <p className="font-semibold">{role}</p>
                <p className="text-sm text-[var(--text-muted)]">RBAC session active via JWT</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && <Trips />}
        {activeTab === 'maintenance' && <Maintenance />}

        <div className="mt-6 text-center">
          <Link to={homePathForRole(role)} className="text-sm text-[var(--primary)] font-semibold">
            Refresh dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
