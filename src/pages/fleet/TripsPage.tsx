import { useCallback, useEffect, useState } from 'react';
import { MapPin, Navigation, Pencil, Plus, RefreshCw, Route, Trash2, Weight } from 'lucide-react';
import { ApiError } from '../../api/client';
import { tripsApi } from '../../api/trips';
import { vehiclesApi } from '../../api/vehicles';
import { driversApi } from '../../api/drivers';
import { FleetShell } from '../../components/FleetShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Vehicle, Driver } from '../../types/fleet';
import {
  TRIP_STATUSES,
  emptyTripForm,
  type Trip,
  type TripFormData,
  type TripStatus,
} from '../../types/trip';

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<TripStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState<TripFormData>(emptyTripForm());
  const [actualDistance, setActualDistance] = useState<string>('');
  const [fuelConsumed, setFuelConsumed] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tripsData, vehiclesData, driversData] = await Promise.all([
        tripsApi.list(statusFilter ? { status: statusFilter } : undefined),
        vehiclesApi.list(),
        driversApi.list(),
      ]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTripForm());
    setActualDistance('');
    setFuelConsumed('');
    setModalOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditing(trip);
    setForm({
      source: trip.source,
      destination: trip.destination,
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
      cargo_weight: trip.cargo_weight,
      planned_distance: trip.planned_distance,
      revenue: trip.revenue,
      status: trip.status,
    });
    setActualDistance(trip.actual_distance !== null ? String(trip.actual_distance) : '');
    setFuelConsumed(trip.fuel_consumed !== null ? String(trip.fuel_consumed) : '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicle_id || !form.driver_id) {
      setError('Please select a vehicle and a driver');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        actual_distance: actualDistance ? Number(actualDistance) : null,
        fuel_consumed: fuelConsumed ? Number(fuelConsumed) : null,
      };

      if (editing) {
        await tripsApi.update(editing.id, payload);
      } else {
        await tripsApi.create(payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await tripsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  // Filter available vehicles and drivers for the form dropdowns.
  // We include currently assigned ones when editing.
  const formVehicles = vehicles.filter(
    (v) => v.status === 'Available' || (editing && v.id === editing.vehicle_id)
  );

  const formDrivers = drivers.filter(
    (d) =>
      (!d.license_expired && d.status === 'Available') ||
      (editing && d.id === editing.driver_id)
  );

  return (
    <FleetShell role="Fleet Manager">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Route size={28} className="text-[var(--primary)]" /> Trip Registry
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Dispatch vehicles, assign drivers, and monitor operational route status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadData()} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Create Trip
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
          {error}
        </div>
      )}

      <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-3 items-center">
          <Select
            label="Status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TripStatus | '')}
            options={[
              { value: '', label: 'All trips' },
              ...TRIP_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            className="max-w-xs"
          />
          <p className="text-sm text-[var(--text-muted)] ml-auto">{trips.length} trip(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--card)]/50">
                <th className="px-4 py-3 font-semibold">Route (From → To)</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Cargo (kg)</th>
                <th className="px-4 py-3 font-semibold">Distance (km)</th>
                <th className="px-4 py-3 font-semibold">Revenue</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    No trips found.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border)]/60 hover:bg-[var(--primary)]/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-500" /> {t.source}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-0.5">
                          <Navigation size={12} className="text-rose-500" /> {t.destination}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.vehicle ? (
                        <div className="flex flex-col">
                          <span className="font-semibold">{t.vehicle.registration_number}</span>
                          <span className="text-xs text-[var(--text-muted)]">{t.vehicle.name_model}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{t.driver?.name || '—'}</td>
                    <td className="px-4 py-3 flex items-center gap-1 mt-3">
                      <Weight size={14} className="text-[var(--text-muted)]" /> {t.cargo_weight.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>Planned: {t.planned_distance} km</span>
                        {t.actual_distance !== null && (
                          <span className="text-xs text-emerald-600 font-medium">
                            Actual: {t.actual_distance} km
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹ {t.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-2 rounded-lg hover:bg-[var(--border)]/50 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Edit Trip' : 'Create Trip'}
        size="lg"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Origin (Source)"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            required
          />
          <Input
            label="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            required
          />

          <Select
            label="Vehicle Assignment"
            value={String(form.vehicle_id)}
            onChange={(e) => setForm({ ...form, vehicle_id: Number(e.target.value) })}
            options={[
              { value: '', label: 'Select vehicle…' },
              ...formVehicles.map((v) => ({
                value: String(v.id),
                label: `${v.registration_number} — ${v.name_model} (${v.status})`,
              })),
            ]}
          />

          <Select
            label="Driver Assignment"
            value={String(form.driver_id)}
            onChange={(e) => setForm({ ...form, driver_id: Number(e.target.value) })}
            options={[
              { value: '', label: 'Select driver…' },
              ...formDrivers.map((d) => ({
                value: String(d.id),
                label: `${d.name} (Safety: ${d.safety_score})`,
              })),
            ]}
          />

          <Input
            label="Cargo Weight (kg)"
            type="number"
            value={String(form.cargo_weight)}
            onChange={(e) => setForm({ ...form, cargo_weight: Number(e.target.value) })}
            required
          />
          <Input
            label="Planned Distance (km)"
            type="number"
            value={String(form.planned_distance)}
            onChange={(e) => setForm({ ...form, planned_distance: Number(e.target.value) })}
            required
          />
          <Input
            label="Planned Revenue (₹)"
            type="number"
            value={String(form.revenue)}
            onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })}
            required
          />

          <Select
            label="Trip Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TripStatus })}
            options={TRIP_STATUSES.map((s) => ({ value: s, label: s }))}
          />

          {form.status === 'Completed' && (
            <>
              <Input
                label="Actual Distance Completed (km)"
                type="number"
                value={actualDistance}
                onChange={(e) => setActualDistance(e.target.value)}
              />
              <Input
                label="Fuel Consumed (Liters)"
                type="number"
                value={fuelConsumed}
                onChange={(e) => setFuelConsumed(e.target.value)}
              />
            </>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} title="Delete Trip">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Are you sure you want to delete the trip from <strong>{deleteTarget?.source}</strong> to{' '}
          <strong>{deleteTarget?.destination}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => void handleDelete()} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </Modal>
    </FleetShell>
  );
}
