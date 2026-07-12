import { useState, useEffect } from 'react';
import { Plus, Wrench, CheckCircle, Trash2, Calendar, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  max_load_capacity: number;
  odometer: number;
  status: string;
}

interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  description: string;
  cost: number;
  status: 'Active' | 'Closed';
  start_date: string;
  end_date?: string;
}

const mockVehicles: Vehicle[] = [
  { id: 1, registration_number: 'VAN-05', name_model: 'Ford Transit', max_load_capacity: 500.0, odometer: 15000.0, status: 'Available' },
  { id: 2, registration_number: 'TRUCK-12', name_model: 'Volvo FH16 Heavy', max_load_capacity: 5000.0, odometer: 80000.0, status: 'Available' },
  { id: 3, registration_number: 'CAR-01', name_model: 'Toyota Prius', max_load_capacity: 350.0, odometer: 12000.0, status: 'Available' }
];

interface MaintenanceProps {
  cardTheme?: 'default' | 'cyberpunk' | 'clay' | 'brutalist';
}

const getCardStyle = (theme: 'default' | 'cyberpunk' | 'clay' | 'brutalist') => {
  switch (theme) {
    case 'cyberpunk':
      return 'bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between hover:border-[var(--primary)] hover:shadow-md transition-all duration-300';
    case 'clay':
      return 'bg-white/90 dark:bg-slate-800/90 rounded-[2.5rem] border-none shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.15),_inset_4px_4px_10px_rgba(255,255,255,0.7),_8px_8px_20px_rgba(0,0,0,0.1)] p-5 flex flex-col justify-between transition-all duration-300';
    case 'brutalist':
      return 'bg-white dark:bg-amber-50 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rounded-none text-slate-900 font-black p-5 flex flex-col justify-between transition-all';
    default:
      return 'glass-card border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300';
  }
};

export function Maintenance({ cardTheme = 'default' }: MaintenanceProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  // Form states
  const [logForm, setLogForm] = useState({
    vehicle_id: '',
    description: '',
    cost: '0',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [logError, setLogError] = useState('');

  const [closeForm, setCloseForm] = useState({
    cost: '',
    end_date: new Date().toISOString().split('T')[0]
  });
  const [closeError, setCloseError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const logsRes = await fetch('/api/maintenance');
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }

      // Fetch vehicles from Person A
      const vehiclesRes = await fetch('/api/vehicles');
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        // Allow choosing any vehicle that is not retired
        setVehicles(data.filter((v: Vehicle) => v.status !== 'Retired'));
      } else {
        setVehicles(mockVehicles);
      }
      
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend APIs. Showing simulation mode data.');
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogError('');

    const vId = parseInt(logForm.vehicle_id);
    const costVal = parseFloat(logForm.cost) || 0.0;

    if (!vId || !logForm.description || !logForm.start_date) {
      setLogError('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vId,
          description: logForm.description,
          cost: costVal,
          start_date: logForm.start_date
        })
      });

      if (res.ok) {
        setShowLogModal(false);
        setLogForm({
          vehicle_id: '',
          description: '',
          cost: '0',
          start_date: new Date().toISOString().split('T')[0]
        });
        loadData();
      } else {
        const errData = await res.json();
        setLogError(errData.detail || 'Failed to log maintenance');
      }
    } catch (err) {
      setLogError('Communication error with backend');
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloseError('');

    if (!selectedLog) return;
    const finalCost = parseFloat(closeForm.cost);

    if (isNaN(finalCost) || !closeForm.end_date) {
      setCloseError('Please enter a valid cost and closing date');
      return;
    }

    try {
      const res = await fetch(`/api/maintenance/${selectedLog.id}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost: finalCost,
          end_date: closeForm.end_date
        })
      });

      if (res.ok) {
        setShowCloseModal(false);
        setCloseForm({ cost: '', end_date: new Date().toISOString().split('T')[0] });
        setSelectedLog(null);
        loadData();
      } else {
        const errData = await res.json();
        setCloseError(errData.detail || 'Failed to close maintenance');
      }
    } catch (err) {
      setCloseError('Communication error with backend');
    }
  };

  const handleDelete = async (logId: number) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      const res = await fetch(`/api/maintenance/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Delete failed');
      }
    } catch (err) {
      alert('Failed to connect to backend.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Maintenance Registry" 
        subtitle="Manage and track maintenance schedules, costs, and shop status" 
        action={
          <Button onClick={() => setShowLogModal(true)}>
            <Plus size={18} className="mr-1" /> Log Maintenance
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Loading maintenance logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-[var(--border)] text-[var(--text-muted)]">
          <Wrench size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No maintenance logs recorded</p>
          <p className="text-sm">Log a new maintenance event to send a vehicle to the shop.</p>
        </div>
      ) : (
        <div className={getCardStyle(cardTheme) + " overflow-hidden !p-0"}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--border)]/20 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                  <th className="p-4">Log ID</th>
                  <th className="p-4">Vehicle ID</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text)]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--border)]/10 transition-colors">
                    <td className="p-4 font-semibold">#M-{log.id}</td>
                    <td className="p-4">
                      <span className="bg-[var(--bg)] border border-[var(--primary)]/30 px-2 py-0.5 rounded font-mono text-xs text-[var(--primary)]">
                        V-{log.vehicle_id}
                      </span>
                    </td>
                    <td className="p-4">{log.description}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        log.status === 'Active' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {log.status === 'Active' ? 'In Shop' : 'Closed'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-[var(--text-muted)]" />
                        {log.start_date}
                      </div>
                    </td>
                    <td className="p-4">
                      {log.end_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-[var(--text-muted)]" />
                          {log.end_date}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] font-italic">-</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold">
                      {log.cost > 0 ? (
                        <span className="text-[var(--text)]">${log.cost.toFixed(2)}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">$0.00</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {log.status === 'Active' ? (
                          <Button size="xs" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
                            setSelectedLog(log);
                            setCloseForm(prev => ({ ...prev, cost: String(log.cost) }));
                            setShowCloseModal(true);
                          }}>
                            <CheckCircle size={12} className="mr-1" /> Close Log
                          </Button>
                        ) : (
                          <Button variant="outline" size="xs" className="text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={() => handleDelete(log.id)}>
                            <Trash2 size={12} className="mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OPEN MAINTENANCE LOG MODAL */}
      <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="Log Vehicle Maintenance">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          {logError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {logError}
            </div>
          )}

          <Select 
            label="Select Vehicle *"
            value={logForm.vehicle_id}
            onChange={e => setLogForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
            options={[
              { value: '', label: 'Select vehicle...' },
              ...vehicles.map(v => ({ value: String(v.id), label: `${v.registration_number} (${v.name_model} - Status: ${v.status})` }))
            ]}
          />

          <Input 
            label="Reason / Description *" 
            value={logForm.description}
            onChange={e => setLogForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g. Engine Oil and Filter Change"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Start Date *" 
              type="date"
              value={logForm.start_date}
              onChange={e => setLogForm(prev => ({ ...prev, start_date: e.target.value }))}
            />
            <Input 
              label="Estimated Cost ($)" 
              type="number"
              value={logForm.cost}
              onChange={e => setLogForm(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" type="button" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button type="submit">Log in Shop</Button>
          </div>
        </form>
      </Modal>

      {/* CLOSE MAINTENANCE LOG MODAL */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Close Maintenance Log">
        <form onSubmit={handleCloseSubmit} className="space-y-4">
          {closeError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {closeError}
            </div>
          )}

          {selectedLog && (
            <div className="text-xs text-[var(--text-muted)] bg-[var(--border)]/10 p-3 rounded-xl">
              <p><span className="font-semibold text-[var(--text)]">Vehicle:</span> V-{selectedLog.vehicle_id}</p>
              <p><span className="font-semibold text-[var(--text)]">Description:</span> {selectedLog.description}</p>
            </div>
          )}

          <Input 
            label="Final Maintenance Cost ($) *" 
            type="number"
            value={closeForm.cost}
            onChange={e => setCloseForm(prev => ({ ...prev, cost: e.target.value }))}
            placeholder="e.g. 150.00"
          />

          <Input 
            label="Completion Date *" 
            type="date"
            value={closeForm.end_date}
            onChange={e => setCloseForm(prev => ({ ...prev, end_date: e.target.value }))}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" type="button" onClick={() => setShowCloseModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">Complete & Release</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
