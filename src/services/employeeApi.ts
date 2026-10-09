import type { ClassificationLevel, User, UserRole } from '../types';

// In development Vite proxies these requests to FastAPI, avoiding cross-origin cookie issues.
const apiUrl = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || '/api/v1');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new Error('Cannot reach the API. Keep FastAPI running on port 8000 and restart Vite, then try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (typeof result.detail === 'string') throw new Error(result.detail);
    if (response.status >= 500) throw new Error(`Backend unavailable or failed (${response.status}). Check that FastAPI is still running on port 8000 and read its terminal output.`);
    throw new Error(`Request failed (${response.status}).`);
  }
  return result as T;
}

export function employeeLogin(email: string, password: string) {
  return request<{ user: User; mustChangePassword: boolean }>('/employee-auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
}

export function employeeMe() {
  return request<{ user: User; mustChangePassword: boolean }>('/employee-auth/me');
}

export function changeEmployeePassword(newPassword: string) {
  return request<{ success: boolean }>('/employee-auth/change-password', {
    method: 'POST', body: JSON.stringify({ newPassword }),
  });
}

export function logoutEmployee() {
  return request<{ success: boolean }>('/employee-auth/logout', { method: 'POST' });
}

export function getEmployees() {
  return request<{ users: User[] }>('/employees');
}

export function provisionEmployee(employee: {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  clearanceLevel: ClassificationLevel;
}) {
  return request<{ user: User; emailSent: boolean; temporaryPassword?: string }>('/employees', {
    method: 'POST', body: JSON.stringify(employee),
  });
}

export function deleteEmployee(employeeId: string) {
  return request<{ success: boolean; message: string }>(`/employees/${encodeURIComponent(employeeId)}`, {
    method: 'DELETE',
  });
}

