import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2, Truck } from 'lucide-react';
import { ApiError } from '../../api/client';
import { vehiclesApi } from '../../api/vehicles';
import { FleetShell } from '../../components/FleetShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  emptyVehicleForm,
  type Vehicle,
  type VehicleFormData,
  type VehicleStatus,
} from '../../types/fleet';

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormData>(emptyVehicleForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehiclesApi.list(statusFilter ? { status: statusFilter } : undefined);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyVehicleForm());
    setModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setForm({
      registration_number: vehicle.registration_number,
      name_model: vehicle.name_model,
      type: vehicle.type,
      max_load_capacity: vehicle.max_load_capacity,
      odometer: vehicle.odometer,
      acquisition_cost: vehicle.acquisition_cost,
      status: vehicle.status,
      region: vehicle.region ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await vehiclesApi.update(editing.id, form);
      } else {
        await vehiclesApi.create(form);
      }
      setModalOpen(false);
      await load();
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
      await vehiclesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FleetShell role="Fleet Manager">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Truck size={28} className="text-[var(--primary)]" /> Vehicle Registry
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Manage fleet assets, capacity, and dispatch eligibility.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Add Vehicle
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">{error}</div>
      )}

      <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-3 items-center">
          <Select
            label="Status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | '')}
            options={[
              { value: '', label: 'All statuses' },
              ...VEHICLE_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            className="max-w-xs"
          />
          <p className="text-sm text-[var(--text-muted)] ml-auto">{vehicles.length} vehicle(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--card)]/50">
                <th className="px-4 py-3 font-semibold">Reg. No.</th>
                <th className="px-4 py-3 font-semibold">Model</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Capacity (kg)</th>
                <th className="px-4 py-3 font-semibold">Odometer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Region</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">Loading…</td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">No vehicles found.</td></tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--primary)]/5 transition-colors">
                    <td className="px-4 py-3 font-semibold">{v.registration_number}</td>
                    <td className="px-4 py-3">{v.name_model}</td>
                    <td className="px-4 py-3">{v.type}</td>
                    <td className="px-4 py-3">{v.max_load_capacity.toLocaleString()}</td>
                    <td className="px-4 py-3">{v.odometer.toLocaleString()} km</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3">{v.region || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-[var(--border)]/50 cursor-pointer" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(v)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer" title="Delete">
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

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'} size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Registration Number" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} required />
          <Input label="Name / Model" value={form.name_model} onChange={(e) => setForm({ ...form, name_model: e.target.value })} required />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })} options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))} />
          <Input label="Max Load (kg)" type="number" value={String(form.max_load_capacity)} onChange={(e) => setForm({ ...form, max_load_capacity: Number(e.target.value) })} required />
          <Input label="Odometer (km)" type="number" value={String(form.odometer)} onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })} />
          <Input label="Acquisition Cost (₹)" type="number" value={String(form.acquisition_cost)} onChange={(e) => setForm({ ...form, acquisition_cost: Number(e.target.value) })} required />
          <Input label="Region" value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} title="Delete Vehicle">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Delete <strong>{deleteTarget?.registration_number}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => void handleDelete()} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Button>
          <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button>
        </div>
      </Modal>
    </FleetShell>
  );
}
