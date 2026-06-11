import axios from 'axios';
const resolveApiBaseUrl = () => {
  const serverUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  const clientUrl = process.env.NEXT_PUBLIC_API_URL;
  const fallbackUrl = 'http://localhost:3001/api';
  const resolvedUrl = typeof window === 'undefined' ? serverUrl : clientUrl;
  if (!resolvedUrl || !resolvedUrl.trim()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_API_URL configuration.');
    }
    return fallbackUrl;
  }
  return resolvedUrl.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
