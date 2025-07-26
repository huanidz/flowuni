import axios from "axios";

export const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
