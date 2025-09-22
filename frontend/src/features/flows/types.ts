export interface Flow {
    flow_id: string;
    name: string;
    description: string;
    is_active: boolean;
    flow_definition?: string | null;
    created_at?: string;
    node_count?: number;
}

export interface Pagination {
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
}

export interface GetFlowsParams {
    userId: number;
    page?: number;
    pageSize?: number;
}

export interface GetFlowsResponse {
    data: Flow[];
    pagination: Pagination;
}

export interface CreateFlowResponse {
    flow_id: string;
}

export interface CreateFlowWithDataRequest {
    name?: string;
    flow_definition?: any;
}

export interface CreateFlowWithDataResponse extends Flow {}

// --- Flow Detail ---

export interface GetFlowDetailParams {
    flowId: string;
}

export interface GetFlowDetailResponse extends Flow {}

// --- Save Flow ---

export interface SaveFlowParams {
    flow_id: string;
    name: string;
    description: string;
    is_active: boolean;
    flow_definition: any;
}

export interface SaveFlowResponse {
    flow_id: string;
    name: string;
    description: string;
    is_active: boolean;
    flow_definition: any;
}

// --- Flow Activation ---

export interface FlowActivationRequest {
    flow_id: string;
    is_active: boolean;
}

export interface FlowActivationResponse {
    flow_id: string;
    name: string;
    description: string;
    is_active: boolean;
}

// --- Playground ChatBox ---

export interface PlaygroundChatBoxPosition {
    x: number;
    y: number;
}

export interface PGMessage {
    id: string;
    user_id: number;
    message: string;
    timestamp: Date;
}
