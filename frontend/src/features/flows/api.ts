import apiClient from "@/api/client";
import { FLOWS_ENDPOINT } from "./consts";
import type {
  GetFlowsParams, 
  GetFlowsResponse, 
  CreateFlowResponse,
  GetFlowDetailParams, 
  GetFlowDetailResponse } from "./types";


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

export const getFlowDetail = async ({
  flowId,
}: GetFlowDetailParams): Promise<GetFlowDetailResponse> => {
  const { data } = await apiClient.get(`${FLOWS_ENDPOINT}/${flowId}`);
  return data;
};