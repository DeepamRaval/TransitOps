import { apiRequest } from './client';
import type { Vehicle, VehicleFormData, VehicleStatus } from '../types/fleet';

export const vehiclesApi = {
  list(params?: { status?: VehicleStatus; type?: string; region?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    if (params?.region) qs.set('region', params.region);
    const query = qs.toString();
    return apiRequest<Vehicle[]>(`/api/vehicles/${query ? `?${query}` : ''}`);
  },

  get(id: number) {
    return apiRequest<Vehicle>(`/api/vehicles/${id}`);
  },

  create(payload: VehicleFormData) {
    return apiRequest<Vehicle>('/api/vehicles/', {
      method: 'POST',
      body: JSON.stringify({ ...payload, region: payload.region || null }),
    });
  },

  update(id: number, payload: Partial<VehicleFormData>) {
    return apiRequest<Vehicle>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, region: payload.region || null }),
    });
  },

  remove(id: number) {
    return apiRequest<void>(`/api/vehicles/${id}`, { method: 'DELETE' });
  },
};
