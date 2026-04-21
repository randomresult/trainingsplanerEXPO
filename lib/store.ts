import { create } from 'zustand';
import { storage } from './storage';
import type { User } from './types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isRestored: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isRestored: false,

  login: async (token: string, user: User) => {
    await Promise.all([
      storage.set('jwt', token),
      storage.set('user', JSON.stringify(user)),
    ]);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await Promise.all([storage.remove('jwt'), storage.remove('user')]);
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const [token, userJson] = await Promise.all([
        storage.get('jwt'),
        storage.get('user'),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true, isRestored: true });
        return;
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      await Promise.all([storage.remove('jwt'), storage.remove('user')]);
    }
    set({ isRestored: true });
  },
}));
