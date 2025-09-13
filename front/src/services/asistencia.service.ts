import api from './apiClient';
import { Asistencia, PageResult } from '../types/api';

export async function listAsistencias(params?: { page?: number; page_size?: number }): Promise<PageResult<Asistencia>> {
  const res = await api.get('/asistencias/', { params });
  return res.data;
}

export async function createAsistencia(payload: Partial<Asistencia>): Promise<Asistencia> {
  const res = await api.post('/asistencias/', payload);
  return res.data;
}

export async function updateAsistencia(id: number, payload: Partial<Asistencia>): Promise<Asistencia> {
  const res = await api.patch(`/asistencias/${id}/`, payload);
  return res.data;
}

export async function deleteAsistencia(id: number): Promise<void> {
  await api.delete(`/asistencias/${id}/`);
}
