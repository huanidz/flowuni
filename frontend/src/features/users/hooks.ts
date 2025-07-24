// features/users/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, fetchUserById } from './api';
import { type User } from './types';

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};

export const useUser = (id: string) => {
  return useQuery<User, Error>({
    queryKey: ['user', id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });
};
