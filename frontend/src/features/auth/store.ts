// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
  isAuthenticated: boolean;
  user_id: string | null;
  username: string | null;
  stateLogin: (user_id: string, username: string) => boolean;
  stateLogout: () => void;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user_id: null,
      username: null,

      stateLogin: (user_id: string, username: string) => {
        if (!user_id || !username) {
          console.warn('Invalid login credentials');
          return false;
        }

        set({
          isAuthenticated: true,
          user_id,
          username,
        });

        return true;
      },

      stateLogout: () => {
        set({
          isAuthenticated: false,
          user_id: null,
          username: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
          get().stateLogout();
          return;
        }

        try {
          const response = await fetch('/api/auth/validate-token', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Token invalid or expired');

          const user = await response.json(); // e.g., { user_id, username }

          get().stateLogin(user.user_id, user.username);
        } catch (error) {
          console.error('Auth validation failed:', error);
          get().stateLogout();
        }
      }
    }),
    {
      name: 'auth-storage', // persisted key in localStorage
    }
  )
);

export default useAuthStore;
