import { useState, useEffect } from 'react';
import { Plus, Navigation, CheckCircle, XCircle, Trash2, MapPin } from 'lucide-react';
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

interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_expiry_date: string;
  status: string;
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  planned_distance: number;
  actual_distance?: number;
  fuel_consumed?: number;
  revenue: number;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
}

const mockVehicles: Vehicle[] = [
  { id: 1, registration_number: 'VAN-05', name_model: 'Ford Transit', max_load_capacity: 500.0, odometer: 15000.0, status: 'Available' },
  { id: 2, registration_number: 'TRUCK-12', name_model: 'Volvo FH16 Heavy', max_load_capacity: 5000.0, odometer: 80000.0, status: 'Available' },
  { id: 3, registration_number: 'CAR-01', name_model: 'Toyota Prius', max_load_capacity: 350.0, odometer: 12000.0, status: 'Available' }
];

const mockDrivers: Driver[] = [
  { id: 1, name: 'Alex Johnson', license_number: 'DL-987654', license_expiry_date: '2028-12-31', status: 'Available' },
  { id: 2, name: 'Sarah Miller', license_number: 'DL-123456', license_expiry_date: '2027-06-15', status: 'Available' },
  { id: 3, name: 'Bob Smith', license_number: 'DL-112233', license_expiry_date: '2029-01-01', status: 'Available' }
];

interface TripsProps {
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

export function Trips({ cardTheme = 'default' }: TripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: '',
    revenue: ''
  });
  const [createError, setCreateError] = useState('');

  const [completeForm, setCompleteForm] = useState({
    actual_distance: '',
    fuel_consumed: '',
    fuel_cost: ''
  });
  const [completeError, setCompleteError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'>('All');

  // Load Trips, Vehicles, and Drivers
  const loadData = async () => {
    setLoading(true);
    try {
      const tripsRes = await fetch('/api/trips');
      if (tripsRes.ok) {
        const data = await tripsRes.json();
        setTrips(data);
      }

      // Fetch vehicles from Person A's endpoint, fallback to mock if 404/error
      const vehiclesRes = await fetch('/api/vehicles?status=Available');
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data);
      } else {
        setVehicles(mockVehicles);
      }

      // Fetch drivers from Person A's endpoint, fallback to mock if 404/error
      const driversRes = await fetch('/api/drivers?status=Available');
      if (driversRes.ok) {
        const data = await driversRes.json();
        setDrivers(data);
      } else {
        setDrivers(mockDrivers);
      }

      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not fetch real data from backend. Showing simulated workspace context.');
      // Sim fallback
      setVehicles(mockVehicles);
      setDrivers(mockDrivers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const vId = parseInt(createForm.vehicle_id);
    const dId = parseInt(createForm.driver_id);
    const cargo = parseFloat(createForm.cargo_weight);
    const distance = parseFloat(createForm.planned_distance);
    const rev = parseFloat(createForm.revenue) || 0;

    if (!createForm.source || !createForm.destination || !vId || !dId || isNaN(cargo) || isNaN(distance)) {
      setCreateError('Please fill in all required fields');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === vId);
    if (selectedVehicle && cargo > selectedVehicle.max_load_capacity) {
      setCreateError(`Cargo weight (${cargo} kg) exceeds vehicle max load capacity (${selectedVehicle.max_load_capacity} kg)`);
      return;
    }

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: createForm.source,
          destination: createForm.destination,
          vehicle_id: vId,
          driver_id: dId,
          cargo_weight: cargo,
          planned_distance: distance,
          revenue: rev
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          source: '',
          destination: '',
          vehicle_id: '',
          driver_id: '',
          cargo_weight: '',
          planned_distance: '',
          revenue: ''
        });
        loadData();
      } else {
        const errData = await res.json();
        setCreateError(errData.detail || 'Failed to create trip');
      }
    } catch (err) {
      setCreateError('Server communication error.');
    }
  };

  const handleDispatch = async (tripId: number) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/dispatch`, { method: 'PUT' });
      if (res.ok) {
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Dispatch failed');
      }
    } catch (err) {
      alert('Failed to connect to backend.');
    }
  };

  const handleCancel = async (tripId: number) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, { method: 'PUT' });
      if (res.ok) {
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Cancel failed');
      }
    } catch (err) {
      alert('Failed to connect to backend.');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError('');

    if (!selectedTrip) return;
    const actDist = parseFloat(completeForm.actual_distance);
    const fuelCons = parseFloat(completeForm.fuel_consumed);
    const fuelCost = parseFloat(completeForm.fuel_cost);

    if (isNaN(actDist) || isNaN(fuelCons) || isNaN(fuelCost)) {
      setCompleteError('Please fill all fields with valid numbers');
      return;
    }

    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_distance: actDist,
          fuel_consumed: fuelCons,
          fuel_cost: fuelCost
        })
      });

      if (res.ok) {
        setShowCompleteModal(false);
        setCompleteForm({ actual_distance: '', fuel_consumed: '', fuel_cost: '' });
        setSelectedTrip(null);
        loadData();
      } else {
        const errData = await res.json();
        setCompleteError(errData.detail || 'Completion failed');
      }
    } catch (err) {
      setCompleteError('Server communication error.');
    }
  };

  const handleDelete = async (tripId: number) => {
    if (!confirm('Are you sure you want to delete this trip draft?')) return;
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Delete failed');
      }
    } catch (err) {
      alert('Failed to delete trip.');
    }
  };

  const filteredTrips = statusFilter === 'All' 
    ? trips 
    : trips.filter(t => t.status === statusFilter);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'Dispatched': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Trip Management" 
        subtitle="Manage transport dispatches and verify cargo/vehicle limits" 
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-1" /> Plan New Trip
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        {(['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              statusFilter === tab 
                ? 'gradient-bg text-white shadow-sm' 
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/20'
            }`}
          >
            {tab} ({tab === 'All' ? trips.length : trips.filter(t => t.status === tab).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Loading trips registry...</div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-[var(--border)] text-[var(--text-muted)]">
          <Navigation size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No trips registered in this state</p>
          <p className="text-sm">Create a new draft trip to start dispatch operations.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map(trip => (
            <div key={trip.id} className={getCardStyle(cardTheme)}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClass(trip.status)}`}>
                    {trip.status}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">Trip #{trip.id}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <MapPin size={16} className="text-blue-500" />
                    <span className="font-semibold">{trip.source}</span>
                  </div>
                  <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700 ml-2"></div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <MapPin size={16} className="text-rose-500" />
                    <span className="font-semibold">{trip.destination}</span>
                  </div>
                </div>

                <hr className="border-[var(--border)]" />

                <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
                  <div>
                    <span className="block font-medium">Planned Distance</span>
                    <span className="font-semibold text-sm text-[var(--text)]">{trip.planned_distance} km</span>
                  </div>
                  <div>
                    <span className="block font-medium">Cargo Weight</span>
                    <span className="font-semibold text-sm text-[var(--text)]">{trip.cargo_weight} kg</span>
                  </div>
                  <div>
                    <span className="block font-medium">Vehicle ID</span>
                    <span className="font-semibold text-sm text-[var(--text)]">V-{trip.vehicle_id}</span>
                  </div>
                  <div>
                    <span className="block font-medium">Driver ID</span>
                    <span className="font-semibold text-sm text-[var(--text)]">D-{trip.driver_id}</span>
                  </div>
                </div>

                {trip.status === 'Completed' && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Actual Distance:</span>
                      <span className="font-semibold text-[var(--text)]">{trip.actual_distance} km</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Fuel Consumed:</span>
                      <span className="font-semibold text-[var(--text)]">{trip.fuel_consumed} Liters</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Fuel Efficiency:</span>
                      <span className="font-semibold text-[var(--text)]">
                        {trip.actual_distance && trip.fuel_consumed 
                          ? (trip.actual_distance / trip.fuel_consumed).toFixed(2) 
                          : 0} km/L
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2 justify-end">
                {trip.status === 'Draft' && (
                  <>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={() => handleDelete(trip.id)}>
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                    <Button size="sm" onClick={() => handleDispatch(trip.id)}>
                      <Navigation size={14} className="mr-1" /> Dispatch
                    </Button>
                  </>
                )}
                {trip.status === 'Dispatched' && (
                  <>
                    <Button variant="outline" size="sm" className="text-rose-500" onClick={() => handleCancel(trip.id)}>
                      <XCircle size={14} className="mr-1" /> Cancel
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                      setSelectedTrip(trip);
                      setShowCompleteModal(true);
                    }}>
                      <CheckCircle size={14} className="mr-1" /> Complete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TRIP MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Plan Transport Trip">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Source Location *" 
              value={createForm.source} 
              onChange={e => setCreateForm(prev => ({ ...prev, source: e.target.value }))}
              placeholder="e.g. Warehouse A"
            />
            <Input 
              label="Destination *" 
              value={createForm.destination} 
              onChange={e => setCreateForm(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="e.g. Client Site B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Cargo Weight (kg) *" 
              type="number" 
              value={createForm.cargo_weight} 
              onChange={e => setCreateForm(prev => ({ ...prev, cargo_weight: e.target.value }))}
              placeholder="e.g. 450"
            />
            <Input 
              label="Planned Distance (km) *" 
              type="number" 
              value={createForm.planned_distance} 
              onChange={e => setCreateForm(prev => ({ ...prev, planned_distance: e.target.value }))}
              placeholder="e.g. 120"
            />
          </div>

          <Input 
            label="Revenue / Booking Value ($)" 
            type="number" 
            value={createForm.revenue} 
            onChange={e => setCreateForm(prev => ({ ...prev, revenue: e.target.value }))}
            placeholder="e.g. 1500"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Select Available Vehicle *"
              value={createForm.vehicle_id}
              onChange={e => setCreateForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
              options={[
                { value: '', label: 'Select vehicle...' },
                ...vehicles.map(v => ({ value: String(v.id), label: `${v.registration_number} (${v.name_model} - Max ${v.max_load_capacity}kg)` }))
              ]}
            />

            <Select 
              label="Select Available Driver *"
              value={createForm.driver_id}
              onChange={e => setCreateForm(prev => ({ ...prev, driver_id: e.target.value }))}
              options={[
                { value: '', label: 'Select driver...' },
                ...drivers.map(d => ({ value: String(d.id), label: `${d.name} (${d.license_number})` }))
              ]}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit">Create Trip</Button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE TRIP MODAL */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Complete Trip & Record Logs">
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          {completeError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {completeError}
            </div>
          )}

          {selectedTrip && (
            <div className="text-xs text-[var(--text-muted)] bg-[var(--border)]/10 p-3 rounded-xl space-y-1">
              <p><span className="font-semibold text-[var(--text)]">Route:</span> {selectedTrip.source} &rarr; {selectedTrip.destination}</p>
              <p><span className="font-semibold text-[var(--text)]">Planned Distance:</span> {selectedTrip.planned_distance} km</p>
            </div>
          )}

          <Input 
            label="Actual Distance Traveled (km) *" 
            type="number"
            value={completeForm.actual_distance}
            onChange={e => setCompleteForm(prev => ({ ...prev, actual_distance: e.target.value }))}
            placeholder="e.g. 122"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Fuel Consumed (Liters) *" 
              type="number"
              value={completeForm.fuel_consumed}
              onChange={e => setCompleteForm(prev => ({ ...prev, fuel_consumed: e.target.value }))}
              placeholder="e.g. 15.5"
            />
            <Input 
              label="Fuel Cost ($) *" 
              type="number"
              value={completeForm.fuel_cost}
              onChange={e => setCompleteForm(prev => ({ ...prev, fuel_cost: e.target.value }))}
              placeholder="e.g. 62.00"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" type="button" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save & Complete</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
