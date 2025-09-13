import api from './apiClient';
import { Usuario, PageResult } from '../types/api';

export async function listUsers(params?: { page?: number; page_size?: number }): Promise<PageResult<Usuario>> {
  const res = await api.get('/users/', { params });
  return res.data;
}

export async function getUser(id: number): Promise<Usuario> {
  const res = await api.get(`/users/${id}/`);
  return res.data;
}

export async function createUser(payload: Partial<Usuario>): Promise<Usuario> {
  const res = await api.post('/users/', payload);
  return res.data;
}

export async function updateUser(id: number, payload: Partial<Usuario>): Promise<Usuario> {
  const res = await api.patch(`/users/${id}/`, payload);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}/`);
}

// Fetch all users by paging through the users endpoint.
// This avoids relying on a single very large page_size and works with server-side pagination.
export type UsersStats = { total_users: number; athletes_count: number };

// Use the backend aggregated endpoint to get counts for users/athletes.
export async function listAllUsers(): Promise<UsersStats> {
  const res = await api.get('/stats/users-count/');
  // Defensive parsing: ensure numeric values (some backends may return strings)
  const data = res.data || {};
  const total_users = Number(data.total_users ?? 0) || 0;
  const athletes_count = Number(data.athletes_count ?? 0) || 0;
  // debug log to help trace issues where frontend shows 0/NaN
  console.debug('[user.service] /stats/users-count response', { raw: res.data, parsed: { total_users, athletes_count } });
  return { total_users, athletes_count };
}
