import api from './apiClient';
import { Pago, PageResult } from '../types/api';

export async function listPagos(params?: { page?: number; page_size?: number }): Promise<PageResult<Pago>> {
  const res = await api.get('/pagos/', { params });
  return res.data;
}

export async function createPago(formData: FormData): Promise<Pago> {
  const res = await api.post('/pagos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function updatePago(id: number, formData: FormData): Promise<Pago> {
  const res = await api.patch(`/pagos/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function deletePago(id: number): Promise<void> {
  await api.delete(`/pagos/${id}/`);
}
