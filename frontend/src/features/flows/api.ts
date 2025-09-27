import apiClient from '@/api/secureClient';
import {
    FLOWS_ENDPOINT,
    FLOW_DEFINITION_COMPILE_ENDPOINT,
    FLOW_DEFINITION_RUN_ENDPOINT,
} from './consts';
import type {
    GetFlowsParams,
    GetFlowsResponse,
    CreateFlowResponse,
    GetFlowDetailParams,
    GetFlowDetailResponse,
    SaveFlowParams,
    SaveFlowResponse,
    CreateFlowWithDataRequest,
    CreateFlowWithDataResponse,
    FlowActivationRequest,
    FlowActivationResponse,
} from './types';
import { getFlowGraphData } from './utils';
import type { Node, Edge } from '@xyflow/react';

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

export const createFlowWithData = async (
    request: CreateFlowWithDataRequest
): Promise<CreateFlowWithDataResponse> => {
    const { data } = await apiClient.post(
        `${FLOWS_ENDPOINT}/with-data`,
        request
    );

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
    console.log('edges: ', edges);
    const payload = getFlowGraphData(nodes, edges);
    const { data } = await apiClient.post(
        `${FLOW_DEFINITION_COMPILE_ENDPOINT}`,
        payload
    );
    return data;
};

export const runFlow = async (
    flow_id: string,
    nodes: Node[],
    edges: Edge[],
    startNode: string | null = null,
    scope: 'node_only' | 'downstream' = 'downstream',
    sessionId: string | null = null
) => {
    const payload = getFlowGraphData(nodes, edges);

    // Create the request payload with optional start_node and scope
    const requestPayload: any = {
        ...payload,
        flow_id,
    };

    // Add start_node and scope to the payload if provided
    if (startNode) {
        requestPayload.start_node = startNode;
        requestPayload.scope = scope;
    }

    if (sessionId) {
        requestPayload.session_id = sessionId;
    }

    console.log('Run Flow payload: ', requestPayload);
    const { data } = await apiClient.post(
        `${FLOW_DEFINITION_RUN_ENDPOINT}`,
        requestPayload
    );
    console.log(data);
    return data;
};

// --- Flow Activation ---

export const activateFlow = async (
    request: FlowActivationRequest
): Promise<FlowActivationResponse> => {
    const { data } = await apiClient.post(
        `${FLOWS_ENDPOINT}/${request.flow_id}/activate`,
        request
    );

    return data;
};
