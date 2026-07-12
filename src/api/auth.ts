import type { AuthTokenResponse, AuthUser } from '../types/auth';

const TOKEN_KEY = 'transitops_token';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = typeof data.detail === 'string'
      ? data.detail
      : data.error || 'Request failed';
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const authApi = {
  sendOtp(email: string, purpose: 'register' | 'reset_password') {
    return request<{ message: string; email: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    });
  },

  verifyOtp(email: string, otp: string, purpose: 'register' | 'reset_password') {
    return request<{ message: string; email: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    });
  },

  register(payload: {
    email: string;
    password: string;
    name: string;
    role: string;
    otp: string;
  }) {
    return request<AuthTokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(email: string, password: string) {
    return request<AuthTokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  resetPassword(email: string, otp: string, new_password: string) {
    return request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    });
  },

  me() {
    return request<AuthUser>('/api/auth/me');
  },
};
