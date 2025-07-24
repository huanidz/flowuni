// src/api/api.ts
import axios from 'axios';
import { refreshToken } from '@/features/auth/api';
import { logout } from '@/features/auth/api';
import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

// Create Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor (e.g. attach token)
apiClient.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Avoid infinite loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const data = await refreshToken();

        // Update both localStorage and axios headers
        sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest); // Retry original request
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        logout(); // Clear token, invalidate session
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
