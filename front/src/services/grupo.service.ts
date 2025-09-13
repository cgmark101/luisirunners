import api from './apiClient';
import { Grupo } from '../types/api';

export async function listGrupos(): Promise<Grupo[]> {
  const res = await api.get('/grupos/');
  return res.data;
}

export async function getGrupo(id: number): Promise<Grupo> {
  const res = await api.get(`/grupos/${id}/`);
  return res.data;
}
