import axios from 'axios';
import qs from 'qs';
import { useAuthStore } from './store';

const BASE_URL = 'https://trainingsplaner-strapi.onrender.com/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // encode: false emits raw brackets/specials so iOS URLSession does a
  // single clean pass of URL-encoding instead of double-encoding the
  // already-percent-escaped characters produced by encodeValuesOnly.
  paramsSerializer: (params) => qs.stringify(params, { encode: false }),
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
