import { useState } from 'react';
import { FleetShell } from '../../components/FleetShell';
import { useAuth } from '../../contexts/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  
  // Initialize values from localStorage or default values
  const [depotName, setDepotName] = useState(
    localStorage.getItem('setting_depot_name') || 'Gandhinagar Depot GJ4'
  );
  const [currency, setCurrency] = useState(
    localStorage.getItem('setting_currency') || 'INR (Rs)'
  );
  const [distanceUnit, setDistanceUnit] = useState(
    localStorage.getItem('setting_distance_unit') || 'Kilometers'
  );

  const [showToast, setShowToast] = useState(false);

  const handleSaveChanges = () => {
    localStorage.setItem('setting_depot_name', depotName);
    localStorage.setItem('setting_currency', currency);
    localStorage.setItem('setting_distance_unit', distanceUnit);
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const username = user?.name || 'Raven K.';
  const userRole = user?.role || 'Dispatcher';
  const initials = username
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <FleetShell role="Fleet Manager">
      <div className="space-y-6 relative">
        {/* Top Header Mockup Component */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 pb-4 border-b border-[var(--border)]/60">
          {/* User Profile / RK Badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--text)]">{username}</span>
            <div className="flex items-center bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl pl-3 pr-1.5 py-1 text-[10px] font-bold uppercase tracking-wider gap-2">
              {userRole}
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[9px]">
                {initials}
              </div>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">Settings & RBAC</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Configure default operational settings and view system permission rules.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* General Settings Column */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-[var(--border)] p-6 bg-[var(--card)] space-y-5">
            <h3 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
              General
            </h3>

            {/* Depot Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Depot Name
              </label>
              <input
                type="text"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            {/* Currency Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Currency
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            {/* Distance Unit Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Distance Unit
              </label>
              <input
                type="text"
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer mt-2"
            >
              Save changes
            </button>
          </div>

          {/* RBAC Column */}
          <div className="lg:col-span-3 glass-card rounded-2xl border border-[var(--border)] p-6 bg-[var(--card)] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider mb-5">
                Role-Based Access (RBAC)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)]/60 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <th className="pb-3 font-bold">Role</th>
                      <th className="pb-3 text-center font-bold">Fleet</th>
                      <th className="pb-3 text-center font-bold">Driver</th>
                      <th className="pb-3 text-center font-bold">Trips</th>
                      <th className="pb-3 text-center font-bold">Fuel/Exp.</th>
                      <th className="pb-3 text-center font-bold">Analytics</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-[var(--border)]/40">
                    <tr className="hover:bg-[var(--border)]/5">
                      <td className="py-3.5 font-semibold text-[var(--text)]">Fleet Manager</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                    </tr>
                    <tr className="hover:bg-[var(--border)]/5">
                      <td className="py-3.5 font-semibold text-[var(--text)]">Dispatcher</td>
                      <td className="py-3.5 text-center text-blue-500 font-semibold italic">view</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                    </tr>
                    <tr className="hover:bg-[var(--border)]/5">
                      <td className="py-3.5 font-semibold text-[var(--text)]">Safety Officer</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                      <td className="py-3.5 text-center text-blue-500 font-semibold italic">view</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                    </tr>
                    <tr className="hover:bg-[var(--border)]/5">
                      <td className="py-3.5 font-semibold text-[var(--text)]">Financial Analyst</td>
                      <td className="py-3.5 text-center text-blue-500 font-semibold italic">view</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-[var(--text-muted)] font-medium">—</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                      <td className="py-3.5 text-center text-emerald-500 font-bold text-base">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showToast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 z-[100] animate-fade-in flex items-center gap-2">
            <span className="text-base">✓</span> Settings updated successfully!
          </div>
        )}
      </div>
    </FleetShell>
  );
}
