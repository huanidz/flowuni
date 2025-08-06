import apiClient from "@/api/secureClient";
import { 
  FLOWS_ENDPOINT, 
  FLOW_DEFINITION_COMPILE_ENDPOINT, 
  FLOW_DEFINITION_RUN_ENDPOINT,
  FLOW_EXECUTION_STREAM_ENDPOINT
} from "./consts";
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
 
export const deleteFlow = async (flowId: string) => {
  await apiClient.delete(`${FLOWS_ENDPOINT}/${flowId}`);
};

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

export const watchFlowExecution = (taskId: string, onMessage: (msg: string) => void, onDone?: () => void) => {
  const eventSource = new EventSource(`${FLOW_EXECUTION_STREAM_ENDPOINT}/${taskId}`);

  eventSource.onmessage = (event) => {
    if (event.data === "DONE") {
      eventSource.close();
      onDone?.();
    } else {
      onMessage(event.data);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE error:", err);
    eventSource.close();
  };

  return eventSource; // so caller can manually close if needed
};