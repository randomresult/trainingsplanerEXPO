import { create } from 'zustand';
import { storage } from './storage';
import type { User } from './types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    storage.set('jwt', token);
    storage.set('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    storage.remove('jwt');
    storage.remove('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreSession: () => {
    try {
      const token = storage.getString('jwt');
      const userJson = storage.getString('user');

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      storage.remove('jwt');
      storage.remove('user');
    }
  },
}));
