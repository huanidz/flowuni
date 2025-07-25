import apiClient from '@/api/client';
import { publicApiClient } from '@/api/publicClient';
import { type LoginPayload, type RegisterPayload } from './types';
import { ACCESS_TOKEN_KEY } from './consts';
import { ENDPOINT_AUTH_LOGIN, ENDPOINT_AUTH_REGISTER, ENDPOINT_AUTH_LOGOUT, ENDPOINT_AUTH_REFRESH_TOKEN } from './consts';


export const register = async (payload: RegisterPayload) => {
  const { data } = await publicApiClient.post(ENDPOINT_AUTH_REGISTER, payload);
  return data;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await publicApiClient.post(ENDPOINT_AUTH_LOGIN, payload);
  
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  return data;
};

export const refreshToken = async () => {
  try {
    const { data } = await publicApiClient.post(ENDPOINT_AUTH_REFRESH_TOKEN);
    
    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    return data;
  } catch (error) {
    // Clear token on refresh failure
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    throw error;
  }
};

export const logout = async () => {
  try {
    await apiClient.post(ENDPOINT_AUTH_LOGOUT, {});
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clean up all auth-related data
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    // If you have other auth data, clear it too
    // localStorage.removeItem('user_preferences');
  }
};
