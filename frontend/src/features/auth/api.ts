import apiClient from '@/api/client';
import { type LoginPayload, type RegisterPayload } from './types';

const TOKEN_KEY = 'flowuni-access-token';

export const register = async (payload: RegisterPayload) => {
  const { data } = await apiClient.post('/auth/register', payload, {
    withCredentials: true,
  });
  return data;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await apiClient.post('/auth/login', payload, {
    withCredentials: true, // 🔒 send/receive cookies (refresh token)
  });

  // Store the access token consistently
  if (data.access_token) {
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
  }

  return data;
};

export const logout = async () => {
  try {
    // Call logout endpoint to invalidate server-side session
    await apiClient.post('/auth/logout', {}, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Continue with client-side cleanup even if server call fails
  } finally {
    // Always clean up client-side token
    sessionStorage.removeItem(TOKEN_KEY);
  }
};