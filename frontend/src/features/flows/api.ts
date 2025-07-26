import apiClient from "@/api/client";
import { FLOWS_ENDPOINT } from "./consts";
import type {
  GetFlowsParams, 
  GetFlowsResponse, 
  CreateFlowResponse,
  GetFlowDetailParams, 
  GetFlowDetailResponse,
  SaveFlowParams,
  SaveFlowResponse,
} from "./types";

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

export const saveFlow = async ({
  flow_id,
  name,
  description,
  is_active,
  flow_definition,
}: SaveFlowParams): Promise<SaveFlowResponse> => {
  const { data } = await apiClient.patch(`${FLOWS_ENDPOINT}/${flow_id}`, {
    flow_id,
    name,
    description,
    is_active: is_active,
    flow_definition: flow_definition,
  });

  return data;
};