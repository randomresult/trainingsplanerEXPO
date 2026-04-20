import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { User } from '../types/models';

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  jwt: string;
  user: User;
}

export const useLogin = () => {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/local', credentials);
      return data;
    },
    onSuccess: (data) => {
      login(data.jwt, data.user);
      router.replace('/(tabs)');
    },
  });
};

export const useRegister = () => {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/local/register', credentials);
      return data;
    },
    onSuccess: (data) => {
      login(data.jwt, data.user);
      router.replace('/(tabs)');
    },
  });
};
