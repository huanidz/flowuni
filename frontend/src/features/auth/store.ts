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
        const { user_id, username, stateLogin, stateLogout } = get();

        // Simulate token check / auth check
        if (user_id && username) {
          stateLogin(user_id, username); // restore session if data exists
        } else {
          stateLogout(); // clear invalid session
        }

        // In a real app, you'd likely check a token or call an API here.
      },
    }),
    {
      name: 'auth-storage', // persisted key in localStorage
    }
  )
);

export default useAuthStore;
