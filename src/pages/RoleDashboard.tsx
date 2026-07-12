import { useEffect, useState } from 'react';
import {
  Activity,
  Clock,
  Route,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { tripsApi } from '../api/trips';
import { vehiclesApi } from '../api/vehicles';
import { FleetShell } from '../components/FleetShell';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Trip } from '../types/trip';
import type { Vehicle } from '../types/fleet';
import type { TransitOpsRole } from '../types/auth';

interface DashboardKPIs {
  active_vehicles: number;
  available_vehicles: number;
  in_maintenance_vehicles: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_percent: number;
}

export function RoleDashboard({ role }: { role: TransitOpsRole }) {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    active_vehicles: 0,
    available_vehicles: 0,
    in_maintenance_vehicles: 0,
    active_trips: 0,
    pending_trips: 0,
    drivers_on_duty: 0,
    fleet_utilization_percent: 0,
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [kpisData, tripsData, vehiclesData] = await Promise.all([
          apiRequest<DashboardKPIs>('/api/dashboard/kpis/'),
          tripsApi.list(),
          vehiclesApi.list(),
        ]);
        setKpis(kpisData);
        setRecentTrips(tripsData.slice(0, 6)); // Display latest 6
        setVehicles(vehiclesData);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboardData();
  }, []);

  const username = user?.name || 'User';

  // Calculate status progress counts
  const totalVehiclesCount = vehicles.length;
  const statusCounts = {
    Available: vehicles.filter((v) => v.status === 'Available').length,
    'On Trip': vehicles.filter((v) => v.status === 'On Trip').length,
    'In Shop': vehicles.filter((v) => v.status === 'In Shop').length,
    Retired: vehicles.filter((v) => v.status === 'Retired').length,
  };

  const getPercentage = (count: number) => {
    if (totalVehiclesCount === 0) return 0;
    return (count / totalVehiclesCount) * 100;
  };

  // Restrict other roles to simple dashboards or render full if Fleet Manager/Safety
  if (role !== 'Fleet Manager' && role !== 'Safety Officer' && role !== 'Financial Analyst') {
    return (
      <FleetShell role={role}>
        <div className="glass-card rounded-[2rem] p-10 border border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 mb-3">Authenticated</p>
          <h1 className="text-4xl font-black tracking-tight mb-3">Welcome, {username}</h1>
          <p className="text-[var(--text-muted)] max-w-2xl mb-8">
            Navigate through your workspace sidebar links to manage assigned operations.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--border)] p-5 bg-[var(--card)]">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Signed in as</p>
              <p className="font-semibold">{username}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] p-5 bg-[var(--card)]">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Role</p>
              <p className="font-semibold">{role}</p>
              <p className="text-sm text-[var(--text-muted)]">Active session via secure gateway</p>
            </div>
          </div>
        </div>
      </FleetShell>
    );
  }

  return (
    <FleetShell role={role}>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">Command Center</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Live fleet operations · {username}</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[var(--text-muted)]">Loading metrics…</div>
      ) : (
        <div className="space-y-6">
          {/* Top Row: utilization and metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Fleet Utilization Card */}
            <div className="lg:col-span-3 glass-card rounded-2xl border border-[var(--border)] p-6 bg-[var(--card)] flex flex-col justify-between min-h-[140px]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-orange-500 font-bold flex items-center gap-1.5">
                  <Activity size={12} /> Fleet Utilization
                </p>
                <div className="text-6xl font-black text-orange-500 mt-2">
                  {kpis.fleet_utilization_percent}%
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Active vehicles running vs total in-service
              </p>
            </div>

            {/* Metrics cards */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="glass-card rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                    Active Vehicles
                  </span>
                  <Truck size={14} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-black text-[var(--text)] mt-4">{kpis.active_vehicles}</div>
              </div>

              <div className="glass-card rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                    Available
                  </span>
                  <Users size={14} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-black text-[var(--text)] mt-4">{kpis.available_vehicles}</div>
              </div>

              <div className="glass-card rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                    In Maintenance
                  </span>
                  <Wrench size={14} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-black text-[var(--text)] mt-4">{kpis.in_maintenance_vehicles}</div>
              </div>

              <div className="glass-card rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                    Active Trips
                  </span>
                  <Route size={14} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-black text-[var(--text)] mt-4">{kpis.active_trips}</div>
              </div>

              <div className="glass-card rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                    Pending Trips
                  </span>
                  <Clock size={14} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-3xl font-black text-[var(--text)] mt-4">{kpis.pending_trips}</div>
              </div>
            </div>
          </div>

          {/* Bottom Layout: Recent Trips and Vehicle Status bars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Trips Table */}
            <div className="lg:col-span-2 glass-card rounded-2xl border border-[var(--border)] p-6 bg-[var(--card)] overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider">
                  Recent Trips
                </h3>
                <span className="text-xs text-[var(--text-muted)]">Latest {recentTrips.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[var(--text-muted)] font-semibold border-b border-[var(--border)] pb-2 bg-[var(--bg)]/10">
                      <th className="py-2.5">Trip</th>
                      <th className="py-2.5">Vehicle</th>
                      <th className="py-2.5">Driver</th>
                      <th className="py-2.5">Route</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                          No recent trips logged.
                        </td>
                      </tr>
                    ) : (
                      recentTrips.map((t) => (
                        <tr key={t.id} className="border-b border-[var(--border)]/40 hover:bg-[var(--border)]/5">
                          <td className="py-3 font-mono font-bold text-[var(--text)]">TR{String(t.id).padStart(4, '0')}</td>
                          <td className="py-3 font-mono">{t.vehicle?.registration_number}</td>
                          <td className="py-3">{t.driver?.name}</td>
                          <td className="py-3 font-medium">
                            {t.source} &rarr; {t.destination}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right sidebar stats panel */}
            <div className="space-y-6">
              {/* Vehicle Status Progress bars */}
              <div className="glass-card rounded-2xl border border-[var(--border)] p-6 bg-[var(--card)]">
                <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider mb-5">
                  Vehicle Status
                </h3>
                <div className="space-y-4">
                  {/* Available bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[var(--text-muted)]">Available</span>
                      <span>{statusCounts.Available}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1c1c1f]">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${getPercentage(statusCounts.Available)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* On Trip bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[var(--text-muted)]">On Trip</span>
                      <span>{statusCounts['On Trip']}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1c1c1f]">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${getPercentage(statusCounts['On Trip'])}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* In Shop bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[var(--text-muted)]">In Shop</span>
                      <span>{statusCounts['In Shop']}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1c1c1f]">
                      <div
                        className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${getPercentage(statusCounts['In Shop'])}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Retired bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[var(--text-muted)]">Retired</span>
                      <span>{statusCounts.Retired}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1c1c1f]">
                      <div
                        className="h-2 rounded-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${getPercentage(statusCounts.Retired)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Drivers on Duty counter footer */}
                <div className="border-t border-[var(--border)] mt-6 pt-4 flex justify-between items-center text-xs">
                  <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    Drivers on Duty
                  </span>
                  <span className="font-bold text-orange-500">{kpis.drivers_on_duty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FleetShell>
  );
}
