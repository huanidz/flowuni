// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/api/client';

export interface AuthState {
  isAuthenticated: boolean;
  user_id: string | null;
  username: string | null;
  stateLogin: (user_id: string, username: string) => boolean;
  stateLogout: () => void;
  checkAuth: () => Promise<void>;
}

const TOKEN_KEY = 'flowuni-access-token';

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
        // Clear token from storage
        sessionStorage.removeItem(TOKEN_KEY);
        
        set({
          isAuthenticated: false,
          user_id: null,
          username: null,
        });
      },

      checkAuth: async () => {
        // Use the same token key and storage method as login
        const token = sessionStorage.getItem(TOKEN_KEY);

        if (!token) {
          get().stateLogout();
          return;
        }

        try {
          // Use apiClient for consistency with the rest of the codebase
          const { data } = await apiClient.get('/auth/validate-token', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            withCredentials: true, // Include cookies for consistency with other API calls
          });
          
          // Validate that we received the expected user data
          if (!data.user_id || !data.username) {
            throw new Error('Invalid user data received');
          }

          get().stateLogin(data.user_id, data.username);
        } catch (error) {
          console.error('Auth validation failed:', error);
          // Clear invalid token and logout user
          get().stateLogout();
          throw error; // Re-throw so calling code can handle if needed
        }
      }
    }),
    {
      name: 'auth-storage', // persisted key in localStorage
      // Only persist user state, not tokens (for security)
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user_id: state.user_id,
        username: state.username,
      }),
    }
  )
);

export default useAuthStore;