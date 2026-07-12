import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { ApiError } from '../../api/client';
import { driversApi } from '../../api/drivers';
import { FleetShell } from '../../components/FleetShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { TransitOpsRole } from '../../types/auth';
import {
  DRIVER_STATUSES,
  LICENSE_CATEGORIES,
  emptyDriverForm,
  type Driver,
  type DriverFormData,
  type DriverStatus,
} from '../../types/fleet';

interface DriversPageProps {
  role: 'Fleet Manager' | 'Safety Officer';
}

export function DriversPage({ role }: DriversPageProps) {
  const canCreate = role === 'Fleet Manager';
  const canDelete = role === 'Fleet Manager';
  const canEdit = role === 'Fleet Manager' || role === 'Safety Officer';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<DriverStatus | ''>('');
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverFormData>(emptyDriverForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await driversApi.list({
        status: statusFilter || undefined,
        expiring_within_days: expiringOnly ? 30 : undefined,
      });
      setDrivers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, expiringOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyDriverForm());
    setModalOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      email: driver.email,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry_date: driver.license_expiry_date,
      contact_number: driver.contact_number,
      safety_score: driver.safety_score,
      status: driver.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await driversApi.update(editing.id, form);
      } else {
        await driversApi.create(form);
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
      await driversApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const licenseWarning = (d: Driver) => {
    if (d.license_expired) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
          <AlertTriangle size={12} /> Expired
        </span>
      );
    }
    if (d.license_expiring_soon) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
          <AlertTriangle size={12} /> Expiring soon
        </span>
      );
    }
    return <span className="text-xs text-[var(--text-muted)]">Valid</span>;
  };

  return (
    <FleetShell role={role as TransitOpsRole}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Users size={28} className="text-[var(--primary)]" /> Driver Management
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {role === 'Safety Officer'
              ? 'Monitor compliance, safety scores, and license validity.'
              : 'Register drivers and track dispatch eligibility.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus size={16} /> Add Driver
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">{error}</div>
      )}

      <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-3 items-end">
          <Select
            label="Status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DriverStatus | '')}
            options={[
              { value: '', label: 'All statuses' },
              ...DRIVER_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            className="max-w-xs"
          />
          <label className="flex items-center gap-2 text-sm pb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={expiringOnly}
              onChange={(e) => setExpiringOnly(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Licenses expiring within 30 days
          </label>
          <p className="text-sm text-[var(--text-muted)] ml-auto">{drivers.length} driver(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--card)]/50">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">License</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Expiry</th>
                <th className="px-4 py-3 font-semibold">License</th>
                <th className="px-4 py-3 font-semibold">Safety</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-[var(--text-muted)]">Loading...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-[var(--text-muted)]">No drivers found.</td></tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--primary)]/5 transition-colors">
                    <td className="px-4 py-3 font-semibold">{d.name}</td>
                    <td className="px-4 py-3 text-xs">{d.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.license_number}</td>
                    <td className="px-4 py-3">{d.license_category}</td>
                    <td className="px-4 py-3">{d.license_expiry_date}</td>
                    <td className="px-4 py-3">{licenseWarning(d)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${d.safety_score < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {d.safety_score}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="inline-flex gap-1">
                          <button onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-[var(--border)]/50 cursor-pointer" title="Edit">
                            <Pencil size={16} />
                          </button>
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(d)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'} size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="License Number" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} required />
          <Select label="Category" value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} options={LICENSE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Input label="License Expiry" type="date" value={form.license_expiry_date} onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })} required />
          <Input label="Contact Number" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} required />
          <Input label="Safety Score (0–100)" type="number" min={0} max={100} value={String(form.safety_score)} onChange={(e) => setForm({ ...form, safety_score: Number(e.target.value) })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })} options={DRIVER_STATUSES.map((s) => ({ value: s, label: s }))} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
        </div>
      </Modal>

      {canDelete && (
        <Modal isOpen={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} title="Delete Driver">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => void handleDelete()} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button>
          </div>
        </Modal>
      )}
    </FleetShell>
  );
}
