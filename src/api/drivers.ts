import { apiRequest } from './client';
import type { Driver, DriverFormData, DriverStatus } from '../types/fleet';

export const driversApi = {
  list(params?: { status?: DriverStatus; expiring_within_days?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.expiring_within_days !== undefined) {
      qs.set('expiring_within_days', String(params.expiring_within_days));
    }
    const query = qs.toString();
    return apiRequest<Driver[]>(`/api/drivers/${query ? `?${query}` : ''}`);
  },

  get(id: number) {
    return apiRequest<Driver>(`/api/drivers/${id}`);
  },

  create(payload: DriverFormData) {
    return apiRequest<Driver>('/api/drivers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: Partial<DriverFormData>) {
    return apiRequest<Driver>(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove(id: number) {
    return apiRequest<void>(`/api/drivers/${id}`, { method: 'DELETE' });
  },
};
