export interface Flow {
  flow_id: string;
  name: string;
  description: string;
  is_active: string;
  flow_definition?: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
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

// --- Flow Detail ---

export interface GetFlowDetailParams {
  flowId: string;
}

export interface GetFlowDetailResponse {
  data: Flow;
}