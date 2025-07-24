export interface Flow {
  flow_id: string;
  name: string;
  description: string;
  is_active: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface GetFlowsResponse {
  data: Flow[];
  pagination: Pagination;
}
