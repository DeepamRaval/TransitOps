import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileDown, RefreshCw, DollarSign, Fuel, TrendingUp, Truck } from 'lucide-react';
import { downloadReport } from '../../utils/pdf';

export function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    fetch('/api/reports/analytics')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch analytics:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const report = data || {
    fuel_efficiency: '0 km/L',
    fleet_utilization_percent: '0%',
    operational_cost: 0,
    vehicle_roi_percent: '0%',
    monthly_analytics: [],
    vehicles_data: [],
    drivers_data: [],
    monthly_revenue: [
      { month: "Jan", revenue: 10000 },
      { month: "Feb", revenue: 15000 },
      { month: "Mar", revenue: 12000 },
      { month: "Apr", revenue: 18000 },
      { month: "May", revenue: 16000 },
      { month: "Jun", revenue: 22000 },
      { month: "Jul", revenue: 20000 }
    ],
    costliest_vehicles: [
      { name: "TRUCK-11", cost: 25000 },
      { name: "MINI-03", cost: 15000 }
    ]
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const title = 'TransitOps Operational Analytics';
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Fuel Efficiency', report.fuel_efficiency],
      ['Fleet Utilization', report.fleet_utilization_percent],
      ['Total Operational Cost', `INR ${report.operational_cost}`],
      ['Average Vehicle ROI', report.vehicle_roi_percent]
    ];
    
    // Add costliest vehicles to the report
    if (report.costliest_vehicles) {
      report.costliest_vehicles.forEach((v: any) => {
        rows.push([`Operational Cost (${v.name})`, `INR ${v.cost.toLocaleString('en-IN')}`]);
      });
    }

    downloadReport(title, headers, rows, format);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Operations Analytics"
        subtitle="Consolidated fleet operations reports and profitability analysis"
        showBack={false}
        action={
          <div className="flex gap-2">
            <Button onClick={() => fetchAnalytics()} variant="outline" className="flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button onClick={() => handleExport('pdf')} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <FileDown size={16} /> Export PDF
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin text-[var(--primary)]" />
          Updating analytics...
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Fuel Efficiency" value={report.fuel_efficiency} icon={<Fuel size={18} className="text-blue-500" />} color="bg-blue-500/10" />
        <StatCard title="Fleet Utilization" value={report.fleet_utilization_percent} icon={<Truck size={18} className="text-indigo-500" />} color="bg-indigo-500/10" />
        <StatCard title="Operational Cost" value={`₹${report.operational_cost}`} icon={<DollarSign size={18} className="text-amber-500" />} color="bg-amber-500/10" />
        <StatCard title="Vehicle ROI" value={report.vehicle_roi_percent} icon={<TrendingUp size={18} className="text-green-500" />} color="bg-green-500/10" />
      </div>

      {/* Formula reference indicator */}
      <div className="text-xs text-[var(--text-muted)] italic font-mono px-1">
        ROI Formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-base font-bold text-[var(--text)] mb-4">Monthly Revenue</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text)'
                  }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Top Costliest Vehicles Horizontal Bars */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text)] mb-6">Top Costliest Vehicles</h3>
            <div className="space-y-6">
              {report.costliest_vehicles.map((v: any, idx: number) => {
                const maxCost = Math.max(...report.costliest_vehicles.map((c: any) => c.cost), 1);
                const percentage = (v.cost / maxCost) * 100;
                
                // Color assignments matching Excalidraw mockup
                let barColor = 'bg-blue-500';
                if (idx === 0) barColor = 'bg-rose-400';
                if (idx === 1) barColor = 'bg-amber-500';

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text)]">{v.name}</span>
                      <span className="text-[var(--text-muted)] font-mono">₹{v.cost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--border)] rounded-full overflow-hidden">
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
