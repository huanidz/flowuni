import apiClient from "@/api/client";
import { FLOWS_ENDPOINT, FLOW_DEFINITION_COMPILE_ENDPOINT, FLOW_DEFINITION_RUN_ENDPOINT } from "./consts";
import type {
  GetFlowsParams, 
  GetFlowsResponse, 
  CreateFlowResponse,
  GetFlowDetailParams, 
  GetFlowDetailResponse,
  SaveFlowParams,
  SaveFlowResponse,
} from "./types";
import { getFlowGraphData } from "./utils";
import type { Node, Edge } from "@xyflow/react";

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

// --- Flow Execution ---

export const compileFlow = async (nodes: Node[], edges: Edge[]) => {
  const payload = getFlowGraphData(nodes, edges);
  const { data } = await apiClient.post(`${FLOW_DEFINITION_COMPILE_ENDPOINT}`, payload);
  return data;
};

export const runFlow = async (nodes: Node[], edges: Edge[]) => {
  const payload = getFlowGraphData(nodes, edges);
  const { data } = await apiClient.post(`${FLOW_DEFINITION_RUN_ENDPOINT}`, payload);
  return data;
};