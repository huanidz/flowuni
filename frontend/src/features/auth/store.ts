import { create } from 'zustand';

export interface AuthState {
  isAuthenticated: boolean;
  user_id: string | null;
  username: string | null;
  // Add the methods to the interface
  stateLogin: (user_id: string, username: string) => void;
  stateLogout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user_id: null,
  username: null,

  stateLogin: (user_id: string, username: string) => {
    // Add basic validation
    if (!user_id || !username) {
      console.warn('Invalid login credentials');
      return;
    }
    
    set({ 
      isAuthenticated: true, 
      user_id, 
      username 
    });
  },
  
  stateLogout: () => {
    set({ 
      isAuthenticated: false, 
      user_id: null, 
      username: null 
    });
  },
}));

export default useAuthStore;