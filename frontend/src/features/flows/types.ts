export interface Flow {
  flow_id: string;
  name: string;
  description: string;
  is_active: string;
}
export interface GetFlowsResponse {
  data: Flow[];
}