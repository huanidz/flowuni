import apiClient from "@/api/client";
import { GET_FLOWS_ENDPOINT } from "./consts";
import { type GetFlowsResponse } from "./types";

export const getFlows = async (): Promise<GetFlowsResponse> => {
  const { data } = await apiClient.get(GET_FLOWS_ENDPOINT);
  return data;
};