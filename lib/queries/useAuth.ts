import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Club, User } from '../types/models';
import type { StrapiResponse } from '../types/api';

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

// Strapi v5 users-permissions has a custom /users/me controller that doesn't
// populate custom relations like clubs. Workaround: fetch /clubs filtered by
// the Managers relation back to the user.
async function fetchFullUser(jwt: string): Promise<User> {
  const auth = { headers: { Authorization: `Bearer ${jwt}` } };

  const me = await apiClient.get<User>('/users/me', auth);

  const clubsResp = await apiClient.get<StrapiResponse<Club[]>>('/clubs', {
    ...auth,
    params: {
      filters: { Managers: { id: { $eq: me.data.id } } },
    },
  });

  return { ...me.data, clubs: clubsResp.data.data };
}

export const useLogin = () => {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/local', credentials);
      const fullUser = await fetchFullUser(data.jwt);
      return { jwt: data.jwt, user: fullUser };
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
      const fullUser = await fetchFullUser(data.jwt);
      return { jwt: data.jwt, user: fullUser };
    },
    onSuccess: (data) => {
      login(data.jwt, data.user);
      router.replace('/(tabs)');
    },
  });
};
