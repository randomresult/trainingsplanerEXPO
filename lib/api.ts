import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const BASE_URL = 'https://trainingsplaner-strapi.onrender.com/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// JWT Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getString('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 401 Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.remove('jwt');
      storage.remove('user');
    }
    return Promise.reject(error);
  }
);
