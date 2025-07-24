import apiClient from '@/api/client';
import { type LoginPayload, type RegisterPayload } from './types';
import { ACCESS_TOKEN_KEY } from './consts';
import { ENDPOINT_AUTH_LOGIN, ENDPOINT_AUTH_REGISTER, ENDPOINT_AUTH_LOGOUT, ENDPOINT_AUTH_REFRESH_TOKEN } from './consts';


export const register = async (payload: RegisterPayload) => {
  const { data } = await apiClient.post(ENDPOINT_AUTH_REGISTER, payload, {
    withCredentials: true,
  });
  return data;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await apiClient.post(ENDPOINT_AUTH_LOGIN, payload, {
    withCredentials: true, // 🔒 send/receive cookies (refresh token)
  });

  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);

  return data;
};

export const refreshToken = async () => {
  const { data } = await apiClient.post(ENDPOINT_AUTH_REFRESH_TOKEN, {}, {
    withCredentials: true, // 🔒 send/receive cookies (refresh token)
  });

  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);

  return data;
};

export const logout = async () => {
  try {
    // Call logout endpoint to invalidate server-side session
    await apiClient.post(ENDPOINT_AUTH_LOGOUT, {}, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Continue with client-side cleanup even if server call fails
  } finally {
    // Always clean up client-side token
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};
