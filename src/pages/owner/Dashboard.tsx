import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/ui/Card';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { Truck, Users, ClipboardList, RefreshCw, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Filters
  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  if (user?.role === 'Driver') {
    return <Navigate to="/dashboard/trips" replace />;
  }
  if (user?.role === 'Safety Officer') {
    return <Navigate to="/dashboard/workers" replace />;
  }

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      vehicle_type: vehicleType,
      status: statusFilter,
      region: regionFilter
    });
    
    fetch(`/api/dashboard/kpis?${query.toString()}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
        setLoading(false);
      });
  }, [vehicleType, statusFilter, regionFilter]);

  const kpis = data || {
    active_vehicles: 53,
    available_vehicles: 42,
    in_maintenance_vehicles: 5,
    active_trips: 18,
    pending_trips: 9,
    drivers_on_duty: 26,
    fleet_utilization_percent: 81.0,
    recent_trips: [
      { id: "TR001", vehicle: "VAN-05", driver: "Alex", status: "On Trip", eta: "45 min" },
      { id: "TR002", vehicle: "TRK-12", driver: "John", status: "Completed", eta: "--" },
      { id: "TR003", vehicle: "MINI-08", driver: "Priya", status: "Dispatched", eta: "1h 10m" },
      { id: "TR004", vehicle: "--", driver: "--", status: "Draft", eta: "Awaiting vehicle" }
    ],
    vehicle_status_counts: {
      "Available": 42,
      "On Trip": 18,
      "In Shop": 5,
      "Retired": 2
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'On Trip':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Completed':
        return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'Dispatched':
        return 'bg-sky-500/10 text-sky-500 border border-sky-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Smart fleet overview and active dispatch monitoring"
        showBack={false}
      />

      {/* Mockup Filter Row */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Vehicle Type</span>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-sm text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
          >
            <option value="All">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Sedan">Sedan</option>
            <option value="Container">Container</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-sm text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Region</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-sm text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
          >
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
        
        {loading && (
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 ml-auto">
            <RefreshCw size={14} className="animate-spin text-[var(--primary)]" />
            Updating metrics...
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard title="Active Vehicles" value={<AnimatedCounter value={kpis.active_vehicles} />} icon={<Truck size={18} className="text-blue-500" />} />
        <StatCard title="Available Vehicles" value={<AnimatedCounter value={kpis.available_vehicles} />} icon={<ShieldCheck size={18} className="text-green-500" />} color="bg-green-500/10" />
        <StatCard title="In Maintenance" value={<AnimatedCounter value={kpis.in_maintenance_vehicles} />} icon={<AlertTriangle size={18} className="text-amber-500" />} color="bg-amber-500/10" />
        <StatCard title="Active Trips" value={<AnimatedCounter value={kpis.active_trips} />} icon={<MapPin size={18} className="text-sky-500" />} color="bg-sky-500/10" />
        <StatCard title="Pending Trips" value={<AnimatedCounter value={kpis.pending_trips} />} icon={<ClipboardList size={18} className="text-purple-500" />} color="bg-purple-500/10" />
        <StatCard title="Drivers on Duty" value={<AnimatedCounter value={kpis.drivers_on_duty} />} icon={<Users size={18} className="text-emerald-500" />} color="bg-emerald-500/10" />
        <StatCard title="Fleet Utilization" value={`${kpis.fleet_utilization_percent}%`} icon={<RefreshCw size={18} className="text-indigo-500" />} color="bg-indigo-500/10" />
      </div>

      {/* Bottom Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Recent Trips Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text)] mb-4">Recent Trips</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)] font-semibold uppercase">
                    <th className="pb-3">Trip</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text)]">
                  {(kpis.recent_trips || []).map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-[var(--border)]/10 transition-colors">
                      <td className="py-3 font-semibold text-[var(--primary)]">{trip.id}</td>
                      <td className="py-3">{trip.vehicle}</td>
                      <td className="py-3">{trip.driver}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[var(--text-muted)] font-mono text-xs">{trip.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel: Vehicle Status Progression Bars */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text)] mb-6">Vehicle Status</h3>
            <div className="space-y-5">
              {Object.entries(kpis.vehicle_status_counts || {}).map(([statusName, count]: [string, any]) => {
                const total = Object.values(kpis.vehicle_status_counts || {}).reduce((s: any, c: any) => s + c, 0) as number;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                // Color mapping matching Excalidraw mockup
                let barColor = 'bg-slate-500';
                if (statusName === 'Available') barColor = 'bg-green-500';
                if (statusName === 'On Trip') barColor = 'bg-blue-500';
                if (statusName === 'In Shop') barColor = 'bg-amber-500';
                if (statusName === 'Retired') barColor = 'bg-rose-500';

                return (
                  <div key={statusName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text)]">{statusName}</span>
                      <span className="text-[var(--text-muted)]">{count} vehicles ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
