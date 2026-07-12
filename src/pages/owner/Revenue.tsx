import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Fuel, RefreshCw } from 'lucide-react';

export function Revenue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Modals Toggles
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Log Fuel Form State
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Add Expense Form State
  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Toll');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState('');

  const fetchExpenses = () => {
    setLoading(true);
    fetch('/api/expenses/logs')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch expenses:", err);
        setLoading(false);
      });
  };

  const fetchVehicles = () => {
    fetch('/api/vehicles/')
      .then(res => res.json())
      .then(resData => {
        setVehicles(resData);
        if (resData.length > 0) {
          setFuelVehicleId(resData[0].id.toString());
          setExpenseVehicleId(resData[0].id.toString());
        }
      })
      .catch(err => {
        console.error("Failed to fetch vehicles list:", err);
      });
  };

  useEffect(() => {
    fetchExpenses();
    fetchVehicles();
  }, []);

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelVehicleId || !fuelLiters || !fuelCost || !fuelDate) return;

    fetch('/api/expenses/fuel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: parseInt(fuelVehicleId),
        liters: parseFloat(fuelLiters),
        cost: parseFloat(fuelCost),
        date: fuelDate
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save fuel log");
        return res.json();
      })
      .then(() => {
        setShowFuelModal(false);
        setFuelLiters('');
        setFuelCost('');
        fetchExpenses();
      })
      .catch(err => alert(err.message));
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseVehicleId || !expenseCost || !expenseDate || !expenseCategory) return;

    fetch('/api/expenses/general', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: parseInt(expenseVehicleId),
        category: expenseCategory,
        cost: parseFloat(expenseCost),
        date: expenseDate,
        description: expenseDesc
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save expense");
        return res.json();
      })
      .then(() => {
        setShowExpenseModal(false);
        setExpenseCost('');
        setExpenseDesc('');
        fetchExpenses();
      })
      .catch(err => alert(err.message));
  };

  const logs = data || {
    fuel_logs: [
      { vehicle: "VAN-05", date: "2026-07-05", liters: 42.0, cost: 3150.0 },
      { vehicle: "TRUCK-11", date: "2026-07-06", liters: 110.0, cost: 8400.0 },
      { vehicle: "MINI-08", date: "2026-07-06", liters: 28.0, cost: 2050.0 }
    ],
    other_expenses: [
      { trip: "TR001", vehicle: "VAN-05", toll: 120.0, other: 0.0, maint: 0.0, total: 120.0, status: "Available" },
      { trip: "TR002", vehicle: "TRK-12", toll: 340.0, other: 150.0, maint: 18000.0, total: 18490.0, status: "Completed" }
    ],
    total_operational_cost: 34070.0
  };

  const displayVehicles = vehicles.length > 0 ? vehicles : [
    { id: 1, registration_number: 'VAN-05' },
    { id: 2, registration_number: 'TRUCK-11' },
    { id: 3, registration_number: 'MINI-08' },
    { id: 4, registration_number: 'TRK-12' },
    { id: 5, registration_number: 'MINI-03' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel & Expense Management"
        subtitle="Track fuel consumption, tolls, workshop repairs and general costs"
        showBack={false}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowFuelModal(true)} className="flex items-center gap-2">
              <Fuel size={16} /> Log Fuel
            </Button>
            <Button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2">
              <Plus size={16} /> Add Expense
            </Button>
          </div>
        }
      />

      {loading && (
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin text-[var(--primary)]" />
          Updating logs...
        </div>
      )}

      {/* Fuel Logs Section */}
      <div className="space-y-3">
        <h3 className="text-sm uppercase font-bold tracking-wider text-[var(--text-muted)]">Fuel Logs</h3>
        <Card className="p-0 overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--border)]/10 text-xs text-[var(--text-muted)] font-semibold uppercase">
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Liters</th>
                  <th className="p-4 text-right">Fuel Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {logs.fuel_logs.map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--border)]/10 transition-colors">
                    <td className="p-4 font-semibold text-[var(--primary)]">{log.vehicle}</td>
                    <td className="p-4 text-xs font-mono">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="p-4">{log.liters} L</td>
                    <td className="p-4 text-right font-bold">₹{log.cost.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Other Expenses Section */}
      <div className="space-y-3">
        <h3 className="text-sm uppercase font-bold tracking-wider text-[var(--text-muted)]">Other Expenses (Toll / Misc)</h3>
        <Card className="p-0 overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--border)]/10 text-xs text-[var(--text-muted)] font-semibold uppercase">
                  <th className="p-4">Trip</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Toll</th>
                  <th className="p-4">Other</th>
                  <th className="p-4">Maint. (Linked)</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {logs.other_expenses.map((expense: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--border)]/10 transition-colors">
                    <td className="p-4 font-semibold text-[var(--primary)]">{expense.trip}</td>
                    <td className="p-4">{expense.vehicle}</td>
                    <td className="p-4">₹{expense.toll.toLocaleString('en-IN')}</td>
                    <td className="p-4">₹{expense.other.toLocaleString('en-IN')}</td>
                    <td className="p-4">₹{expense.maint.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-semibold text-[var(--text)]">₹{expense.total.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        expense.status === 'Completed' || expense.status === 'Available'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Auto Aggregated Cost Sum Display Card */}
      <div className="glass-card rounded-2xl p-6 flex justify-between items-center bg-gradient-to-r from-[var(--primary)]/5 to-[var(--accent)]/5 border border-[var(--primary)]/20">
        <div className="space-y-1">
          <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">Total Operational Cost (Auto)</span>
          <p className="text-xs text-[var(--text-muted)]">Computed formula: Total Fuel Cost + General Expenses + Tolls + Maintenance Costs</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-amber-500 font-mono">₹{logs.total_operational_cost.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Log Fuel Modal */}
      <Modal isOpen={showFuelModal} onClose={() => setShowFuelModal(false)} title="Log Fuel Purchase" size="sm">
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Select Vehicle</label>
            <select
              value={fuelVehicleId}
              onChange={(e) => setFuelVehicleId(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              required
            >
              {displayVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Date</label>
            <input
              type="date"
              value={fuelDate}
              onChange={(e) => setFuelDate(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Liters (L)</label>
              <input
                type="number"
                step="0.01"
                placeholder="42.5"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="3150"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowFuelModal(false)}>Cancel</Button>
            <Button type="submit">Save Log</Button>
          </div>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record Other Expense" size="sm">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Select Vehicle</label>
            <select
              value={expenseVehicleId}
              onChange={(e) => setExpenseVehicleId(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              required
            >
              {displayVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Category</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                required
              >
                <option value="Toll">Toll</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="150"
                value={expenseCost}
                onChange={(e) => setExpenseCost(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Description (Optional)</label>
            <textarea
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="e.g., Highway NH-4 Toll tax"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
