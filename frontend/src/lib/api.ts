import axios from 'axios';
import { getSession } from 'next-auth/react';

const resolveApiBaseUrl = () => {
  const serverUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  const clientUrl = process.env.NEXT_PUBLIC_API_URL;
  const fallbackUrl = 'http://localhost:3001/api';
  const resolvedUrl = typeof window === 'undefined' ? serverUrl : clientUrl;

  if (!resolvedUrl || !resolvedUrl.trim()) {
    return fallbackUrl;
  }

  return resolvedUrl.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      config.headers.Authorization = `Bearer ${localToken}`;
      return config;
    }

    try {
      const session = await getSession();
      const accessToken = (session?.user as any)?.accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch {
      // Ignore session lookup failures and continue without auth header.
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
