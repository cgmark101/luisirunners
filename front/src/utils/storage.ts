const ACCESS_KEY = 'lr_access_token';
const REFRESH_KEY = 'lr_refresh_token';

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_KEY, token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
