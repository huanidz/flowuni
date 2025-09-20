import type { Node, Edge } from '@xyflow/react';

// FlowSnapshot interface based on the backend FlowSnapshotModel
export interface FlowSnapshot {
    id: number;
    flow_id: string;
    version: number;
    name?: string;
    description?: string;
    flow_definition: {
        nodes: Node[];
        edges: Edge[];
    };
    snapshot_metadata?: Record<string, any>;
    flow_schema_version?: string;
    created_at?: string;
}

// Request type for creating a flow snapshot
export interface CreateFlowSnapshotRequest {
    flow_id: string;
    name?: string;
    description?: string;
    flow_definition: {
        nodes: Node[];
        edges: Edge[];
    };
    snapshot_metadata?: Record<string, any>;
    flow_schema_version?: string;
}

// Response type for creating a flow snapshot
export interface CreateFlowSnapshotResponse extends FlowSnapshot {}

// Response type for listing flow snapshots
export interface FlowSnapshotListResponse {
    data: FlowSnapshot[];
    total_count: number;
}

// Parameters for getting flow snapshots
export interface GetFlowSnapshotsParams {
    flow_id: string;
    page?: number;
    per_page?: number;
}

// Response type for getting a single flow snapshot by ID
export interface GetFlowSnapshotResponse extends FlowSnapshot {}
