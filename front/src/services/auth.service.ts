import api from './apiClient';
import { setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from '../utils/storage';

export async function login(username: string, password: string) {
  const res = await api.post('/token/', { username, password }).catch((e) => { throw e; });
  const { access, refresh } = res.data;
  setAccessToken(access);
  setRefreshToken(refresh);
  return { access, refresh };
}

export async function refresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await api.post('/token/refresh/', { refresh: refreshToken });
  const { access } = res.data;
  setAccessToken(access);
  return access;
}

export async function logout() {
  clearTokens();
}
