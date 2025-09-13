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
