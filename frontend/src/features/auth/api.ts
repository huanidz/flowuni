import apiClient from "@/api/client";
import { type LoginPayload, type RegisterPayload } from "./types";

export const register = async (payload: RegisterPayload) => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
};