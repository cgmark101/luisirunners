import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.1.111:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // token may be null in error case, but resolve signature expects string — guard
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;
    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalConfig.headers.Authorization = 'Bearer ' + token;
              return api(originalConfig);
            })
            .catch((err) => Promise.reject(err));
        }

        originalConfig._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          return Promise.reject(err);
        }

        try {
          const response = await axios.post(`${API_BASE.replace('/api','')}/api/token/refresh/`, { refresh: refreshToken });
          const { access } = response.data;
          setAccessToken(access);
          api.defaults.headers.common.Authorization = 'Bearer ' + access;
          processQueue(null, access);
          return api(originalConfig);
        } catch (e) {
          processQueue(e, null);
          clearTokens();
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
