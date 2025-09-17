// src/api/api.ts
import axios from 'axios';
import { refreshToken } from '@/features/auth/api';
import { logout } from '@/features/auth/api';
import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

const MAX_RETRY_ATTEMPTS = 1;
const RETRY_DELAY_MS = 1000;

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Handle retry limit
        if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
        }

        if (originalRequest._retryCount >= MAX_RETRY_ATTEMPTS) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for ongoing refresh
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            originalRequest._retryCount++;
            isRefreshing = true;

            try {
                const data = await refreshToken();

                localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

                processQueue(null, data.access_token);

                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                processQueue(refreshError, null);
                logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle general retry with delay for other errors
        if (error.response?.status !== 401) {
            originalRequest._retryCount++;

            // Add delay before retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));

            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
