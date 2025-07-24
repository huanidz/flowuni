import { useMutation } from '@tanstack/react-query';
import { register, login } from './api';
import type {
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
} from './types';

export const useRegister = () => {
  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: register,
    onSuccess: data => {
      console.log(data);
    },
  });
};

export const useLogin = () => {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: login,
    onSuccess: data => {
      console.log(data);
    },
  });
};
