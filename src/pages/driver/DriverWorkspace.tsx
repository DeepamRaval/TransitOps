import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, MapPin, Navigation, Play, RefreshCw, Route } from 'lucide-react';
import { ApiError } from '../../api/client';
import { tripsApi } from '../../api/trips';
import { FleetShell } from '../../components/FleetShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Trip } from '../../types/trip';

export function DriverWorkspace() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completeTarget, setCompleteTarget] = useState<Trip | null>(null);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tripsApi.list();
      setTrips(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load assigned trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const handleStartTrip = async (tripId: number) => {
    setSaving(true);
    setError('');
    try {
      await tripsApi.update(tripId, { status: 'In Transit' });
      await loadTrips();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start trip');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!completeTarget) return;
    if (!actualDistance) {
      setError('Please provide the actual distance completed');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await tripsApi.update(completeTarget.id, {
        status: 'Completed',
        actual_distance: Number(actualDistance),
        fuel_consumed: fuelConsumed ? Number(fuelConsumed) : null,
      });
      setCompleteTarget(null);
      setActualDistance('');
      setFuelConsumed('');
      await loadTrips();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete trip');
    } finally {
      setSaving(false);
    }
  };

  // Classify trips
  const activeTrip = trips.find((t) => t.status === 'In Transit');
  const upcomingTrips = trips.filter((t) => t.status === 'Scheduled');
  const pastTrips = trips.filter((t) => t.status === 'Completed' || t.status === 'Cancelled');

  return (
    <FleetShell role="Driver">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Route size={28} className="text-[var(--primary)]" /> Driver Workspace
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Manage your active route, view dispatch notes, and log trip completion info.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={() => void loadTrips()} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-[var(--text-muted)]">Loading assigned trips…</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Trip Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTrip ? (
              <div className="glass-card rounded-[2rem] border-2 border-[var(--primary)] p-6 bg-[var(--card)] relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 bg-[var(--primary)] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                  Active Trip
                </div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Play size={18} className="text-[var(--primary)] animate-pulse" /> Ongoing Journey
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg)]/50">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Route</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="text-sm font-semibold">{activeTrip.source}</span>
                      </div>
                      <div className="w-[1px] h-3 bg-[var(--border)] ml-1.5"></div>
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-rose-500" />
                        <span className="text-sm font-semibold">{activeTrip.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg)]/50 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Cargo</p>
                      <p className="font-semibold text-sm">{activeTrip.cargo_weight} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Vehicle</p>
                      <p className="font-semibold text-sm">{activeTrip.vehicle?.registration_number}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{activeTrip.vehicle?.name_model}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold text-white"
                    onClick={() => {
                      setCompleteTarget(activeTrip);
                      setActualDistance(String(activeTrip.planned_distance));
                    }}
                  >
                    Complete Trip & Log Info
                  </Button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-[2rem] border border-[var(--border)] p-8 text-center bg-[var(--card)]/50">
                <div className="w-12 h-12 rounded-full bg-[var(--border)]/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-[var(--text-muted)]" />
                </div>
                <h3 className="font-bold text-lg">No active trip</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                  You are not currently on a trip. Check your upcoming assignments below to start your next journey.
                </p>
              </div>
            )}

            {/* Upcoming Trips */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-amber-500" /> Upcoming Assignments ({upcomingTrips.length})
              </h2>
              {upcomingTrips.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic">No upcoming trips scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTrips.map((t) => (
                    <div
                      key={t.id}
                      className="glass-card rounded-2xl border border-[var(--border)] p-4 bg-[var(--card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          <span>{t.source}</span>
                          <span className="text-[var(--text-muted)]">→</span>
                          <span>{t.destination}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Vehicle: {t.vehicle?.registration_number} ({t.vehicle?.name_model}) | Capacity: {t.cargo_weight} kg | Planned: {t.planned_distance} km
                        </p>
                      </div>
                      <Button
                        onClick={() => void handleStartTrip(t.id)}
                        disabled={saving || !!activeTrip}
                        className="gap-1.5 self-start sm:self-auto"
                        title={activeTrip ? 'Finish ongoing trip first' : 'Start Journey'}
                      >
                        <Play size={14} /> Start Trip
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Trips sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" /> Trip History ({pastTrips.length})
            </h2>
            {pastTrips.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">No past trips recorded.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {pastTrips.map((t) => (
                  <div
                    key={t.id}
                    className="glass-card rounded-xl border border-[var(--border)]/80 p-3 bg-[var(--card)]/60 text-xs"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">Trip #{t.id}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="font-semibold">{t.source} → {t.destination}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[var(--text-muted)]">
                      <div>Planned: {t.planned_distance} km</div>
                      <div>Actual: {t.actual_distance || '—'} km</div>
                      <div>Vehicle: {t.vehicle?.registration_number}</div>
                      <div>Fuel: {t.fuel_consumed !== null ? `${t.fuel_consumed} L` : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      <Modal
        isOpen={!!completeTarget}
        onClose={() => !saving && setCompleteTarget(null)}
        title="Complete Trip Log"
      >
        {completeTarget && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-xs">
              <p className="font-bold text-sm mb-1">{completeTarget.source} → {completeTarget.destination}</p>
              <p className="text-[var(--text-muted)]">
                Vehicle: {completeTarget.vehicle?.registration_number} | Planned Distance: {completeTarget.planned_distance} km
              </p>
            </div>

            <Input
              label="Actual Distance Traveled (km)"
              type="number"
              value={actualDistance}
              onChange={(e) => setActualDistance(e.target.value)}
              required
            />

            <Input
              label="Fuel Consumed (Liters)"
              type="number"
              value={fuelConsumed}
              onChange={(e) => setFuelConsumed(e.target.value)}
              placeholder="Optional"
            />

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => void handleCompleteTrip()} disabled={saving}>
                {saving ? 'Submitting…' : 'Submit & Complete'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setCompleteTarget(null)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </FleetShell>
  );
}
