// features/users/api.ts
import api from '@/api/secureClient';
import { type User } from './types';

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users');
  return data;
};

export const fetchUserById = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};
