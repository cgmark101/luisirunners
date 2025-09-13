import api from './apiClient';
import { SessionDay } from '../types/api';

export async function listSessionDays(): Promise<SessionDay[]> {
  const res = await api.get('/session-days/');
  return res.data;
}

export async function createSessionDay(payload: Partial<SessionDay>): Promise<SessionDay> {
  const res = await api.post('/session-days/', payload);
  return res.data;
}

export async function activateSessionDay(id: number): Promise<SessionDay> {
  const res = await api.post(`/session-days/${id}/activate/`);
  return res.data;
}

export async function deactivateSessionDay(id: number): Promise<SessionDay> {
  const res = await api.post(`/session-days/${id}/deactivate/`);
  return res.data;
}

export async function updateSessionDay(id: number, payload: Partial<SessionDay>): Promise<SessionDay> {
  const res = await api.patch(`/session-days/${id}/`, payload);
  return res.data;
}

export async function deleteSessionDay(id: number): Promise<void> {
  await api.delete(`/session-days/${id}/`);
}
