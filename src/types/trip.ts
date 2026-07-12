export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  planned_distance: number;
  actual_distance: number | null;
  fuel_consumed: number | null;
  revenue: number;
  status: TripStatus;
  vehicle?: {
    id: number;
    registration_number: string;
    name_model: string;
  };
  driver?: {
    id: number;
    name: string;
  };
}

export interface TripFormData {
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  planned_distance: number;
  revenue: number;
  status: TripStatus;
}

export const TRIP_STATUSES: TripStatus[] = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

export const emptyTripForm = (): TripFormData => ({
  source: '',
  destination: '',
  vehicle_id: 0,
  driver_id: 0,
  cargo_weight: 0,
  planned_distance: 0,
  revenue: 0,
  status: 'Draft',
});
