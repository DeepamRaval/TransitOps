export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region: string | null;
}

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
  license_expired: boolean;
  license_expiring_soon: boolean;
}

export const VEHICLE_STATUSES: VehicleStatus[] = ['Available', 'On Trip', 'In Shop', 'Retired'];
export const DRIVER_STATUSES: DriverStatus[] = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
export const VEHICLE_TYPES = ['Truck', 'Van', 'Sedan', 'Container'];
export const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HGV', 'MCWG'];

export type VehicleFormData = Omit<Vehicle, 'id'>;
export type DriverFormData = Omit<Driver, 'id' | 'license_expired' | 'license_expiring_soon'>;

export const emptyVehicleForm = (): VehicleFormData => ({
  registration_number: '',
  name_model: '',
  type: 'Van',
  max_load_capacity: 500,
  odometer: 0,
  acquisition_cost: 0,
  status: 'Available',
  region: '',
});

export const emptyDriverForm = (): DriverFormData => ({
  name: '',
  license_number: '',
  license_category: 'LMV',
  license_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  contact_number: '',
  safety_score: 100,
  status: 'Available',
});
