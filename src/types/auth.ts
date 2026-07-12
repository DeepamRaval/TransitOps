export type TransitOpsRole =
  | 'Fleet Manager'
  | 'Driver'
  | 'Safety Officer'
  | 'Financial Analyst';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: TransitOpsRole;
  email_verified: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const TRANSIT_OPS_ROLES: TransitOpsRole[] = [
  'Fleet Manager',
  'Driver',
  'Safety Officer',
  'Financial Analyst',
];

export function homePathForRole(role: TransitOpsRole): string {
  switch (role) {
    case 'Fleet Manager':
      return '/fleet';
    case 'Driver':
      return '/driver';
    case 'Safety Officer':
      return '/safety';
    case 'Financial Analyst':
      return '/finance';
    default:
      return '/login';
  }
}

export const DEMO_ACCOUNTS: { email: string; role: TransitOpsRole; password: string }[] = [
  { email: 'fleet.manager@transitops.dev', role: 'Fleet Manager', password: 'TransitOps@123' },
  { email: 'driver@transitops.dev', role: 'Driver', password: 'TransitOps@123' },
  { email: 'safety@transitops.dev', role: 'Safety Officer', password: 'TransitOps@123' },
  { email: 'finance@transitops.dev', role: 'Financial Analyst', password: 'TransitOps@123' },
];
