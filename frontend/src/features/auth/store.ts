// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/api/secureClient';

export interface AuthState {
  isAuthenticated: boolean;
  user_id: number | null;
  isValidating: boolean; // Add loading state
  stateLogin: (user_id: number) => boolean;
  stateLogout: () => void;
  checkAuth: () => Promise<void>;
}

const TOKEN_KEY = 'flowuni-access-token';
const VALIDATING_TIME_MS = 300; // ms. This is used to block spam.

// Prevent duplicate requests when user spams F5
let validationPromise: Promise<void> | null = null;

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user_id: null,
      isValidating: false,

      stateLogin: (user_id: number) => {
        if (!user_id) {
          console.warn('Invalid login credentials');
          return false;
        }

        set({
          isAuthenticated: true,
          user_id,
          isValidating: false,
        });

        return true;
      },

      stateLogout: () => {
        sessionStorage.removeItem(TOKEN_KEY);
        
        set({
          isAuthenticated: false,
          user_id: null,
          isValidating: false,
        });
      },

      checkAuth: async () => {
        // If there's already a validation in progress, wait for it
        if (validationPromise) {
          return await validationPromise;
        }

        // Create and cache the validation promise
        validationPromise = (async () => {
          const token = sessionStorage.getItem(TOKEN_KEY);

          if (!token) {
            get().stateLogout();
            return;
          }

          set({ isValidating: true });

          try {
            // Add artificial delay to smooth out rapid refreshes
            const [validationResult] = await Promise.all([
              apiClient.get('/auth/validate-token', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                withCredentials: true,
              }),
              new Promise(resolve => setTimeout(resolve, VALIDATING_TIME_MS)) // 100ms delay
            ]);

            const { data } = validationResult;
            
            if (!data.user_id) {
              throw new Error('Invalid user data received');
            }

            set({
              isAuthenticated: true,
              user_id: data.user_id,
              isValidating: false,
            });
          } catch (error) {
            console.error('Auth validation failed:', error);
            get().stateLogout();
            throw error;
          }
        })();

        try {
          await validationPromise;
        } finally {
          validationPromise = null; // Clear the promise when done
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user_id: state.user_id,
        // Don't persist isValidating - should always start false
      }),
    }
  )
);

export default useAuthStore;