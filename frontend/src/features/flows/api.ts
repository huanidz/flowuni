import apiClient from "@/api/client";
import { FLOWS_ENDPOINT } from "./consts";
import type { GetFlowsResponse, CreateFlowResponse } from "./types";

interface GetFlowsParams {
  userId: number;
  page?: number;
  pageSize?: number;
}

export const getFlows = async ({
  userId,
  page = 1,
  pageSize = 10,
}: GetFlowsParams): Promise<GetFlowsResponse> => {
  const { data } = await apiClient.get(FLOWS_ENDPOINT, {
    params: { user_id: userId, page, per_page: pageSize },
  });
  return data;
};

export const createEmtpyFlow = async (): Promise<CreateFlowResponse> => {
  const { data } = await apiClient.post(FLOWS_ENDPOINT);

  return data;
};