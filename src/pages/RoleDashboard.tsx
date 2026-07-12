import { useEffect, useState } from 'react';

import { apiRequest } from '../api/client';
import { FleetShell } from '../components/FleetShell';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { TransitOpsRole } from '../types/auth';

interface DashboardKPIs {
  active_vehicles: number;
  available_vehicles: number;
  in_maintenance_vehicles: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_percent: number;
  recent_trips?: any[];
  vehicle_status_counts: {
    Available: number;
    'On Trip': number;
    'In Shop': number;
    Retired: number;
  };
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
    recent_trips: [],
    vehicle_status_counts: {
      Available: 0,
      'On Trip': 0,
      'In Shop': 0,
      Retired: 0,
    },
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const padValue = (val: number) => String(val).padStart(2, '0');

  // Filter states
  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (vehicleType !== 'All') params.set('vehicle_type', vehicleType);
        if (statusFilter !== 'All') params.set('status', statusFilter);
        if (regionFilter !== 'All') params.set('region', regionFilter);

        const qs = params.toString();
        const url = `/api/dashboard/kpis${qs ? `?${qs}` : ''}`;

        const kpisData = await apiRequest<DashboardKPIs>(url);
        setKpis(kpisData);
        setRecentTrips(kpisData.recent_trips || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboardData();
  }, [vehicleType, statusFilter, regionFilter]);

  const username = user?.name || 'User';

  // Calculate status progress counts from filtered KPIs
  const statusCounts = kpis.vehicle_status_counts;
  const totalVehiclesCount = statusCounts.Available + statusCounts['On Trip'] + statusCounts['In Shop'] + statusCounts.Retired;

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
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">Command Center</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Live fleet operations · {username}</p>
        </div>

        {/* Filters block */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Filters</span>
          <div className="flex flex-wrap gap-3">
            {/* Vehicle Type select */}
            <div className="relative">
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-all shadow-sm h-9"
              >
                <option value="All">Vehicle Type: All</option>
                <option value="Van">Vehicle Type: Van</option>
                <option value="Truck">Vehicle Type: Truck</option>
                <option value="Sedan">Vehicle Type: Sedan</option>
                <option value="Container">Vehicle Type: Container</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            {/* Status select */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-all shadow-sm h-9"
              >
                <option value="All">Status: All</option>
                <option value="Available">Status: Available</option>
                <option value="On Trip">Status: On Trip</option>
                <option value="In Shop">Status: In Shop</option>
                <option value="Retired">Status: Retired</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            {/* Region select */}
            <div className="relative">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-all shadow-sm h-9"
              >
                <option value="All">Region: All</option>
                <option value="North">Region: North</option>
                <option value="South">Region: South</option>
                <option value="East">Region: East</option>
                <option value="West">Region: West</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[var(--text-muted)]">Loading metrics…</div>
      ) : (
        <div className="space-y-6">
          {/* Top Row: All 7 metrics cards in a single responsive row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Active Vehicles */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-blue-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Active Vehicles
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{padValue(kpis.active_vehicles)}</div>
            </div>

            {/* Available Vehicles */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-emerald-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Available Vehicles
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{padValue(kpis.available_vehicles)}</div>
            </div>

            {/* Vehicles In Maintenance */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-orange-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Vehicles in Maintenance
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{padValue(kpis.in_maintenance_vehicles)}</div>
            </div>

            {/* Active Trips */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-blue-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Active Trips
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{padValue(kpis.active_trips)}</div>
            </div>

            {/* Pending Trips */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-blue-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Pending Trips
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{padValue(kpis.pending_trips)}</div>
            </div>

            {/* Drivers on Duty */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-blue-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Drivers on Duty
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{padValue(kpis.drivers_on_duty)}</div>
            </div>

            {/* Fleet Utilization */}
            <div className="glass-card rounded-2xl border border-[var(--border)] border-l-4 border-l-emerald-500 p-4 bg-[var(--card)] flex flex-col justify-between min-h-[105px]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-tight">
                Fleet Utilization
              </span>
              <div className="text-3xl font-black text-[var(--text)] mt-2">{Math.round(kpis.fleet_utilization_percent)}%</div>
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

                {/* Drivers on Duty counter footer removed to avoid duplication */}
              </div>
            </div>
          </div>
        </div>
      )}
    </FleetShell>
  );
}
