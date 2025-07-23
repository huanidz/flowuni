import { useMutation } from "@tanstack/react-query";
import { register } from "./api";
import type {  RegisterPayload, RegisterResponse } from "./types"; 

export const useRegister = () => {
  return useMutation<RegisterResponse, Error, RegisterPayload>(
    {
      mutationFn: register,
      onSuccess: (data) => {
        console.log(data);
      },
    }
  );
};