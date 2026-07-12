import { apiRequest } from './client';
import type { Trip, TripFormData, TripStatus } from '../types/trip';

export const tripsApi = {
  list(params?: { status?: TripStatus; driver_id?: number; vehicle_id?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.driver_id !== undefined) qs.set('driver_id', String(params.driver_id));
    if (params?.vehicle_id !== undefined) qs.set('vehicle_id', String(params.vehicle_id));
    const query = qs.toString();
    return apiRequest<Trip[]>(`/api/trips/${query ? `?${query}` : ''}`);
  },

  get(id: number) {
    return apiRequest<Trip>(`/api/trips/${id}`);
  },

  create(payload: TripFormData) {
    return apiRequest<Trip>('/api/trips/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: Partial<TripFormData> & { actual_distance?: number | null; fuel_consumed?: number | null }) {
    return apiRequest<Trip>(`/api/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove(id: number) {
    return apiRequest<void>(`/api/trips/${id}`, { method: 'DELETE' });
  },
};
