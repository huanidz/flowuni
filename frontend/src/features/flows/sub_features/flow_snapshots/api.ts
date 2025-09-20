import apiClient from '@/api/secureClient';
import { FLOW_SNAPSHOTS_ENDPOINT } from './const';
import type {
    CreateFlowSnapshotRequest,
    CreateFlowSnapshotResponse,
    GetFlowSnapshotsParams,
    FlowSnapshotListResponse,
    GetFlowSnapshotResponse,
} from './types';

/**
 * Create a new flow snapshot
 */
export const createFlowSnapshot = async (
    request: CreateFlowSnapshotRequest
): Promise<CreateFlowSnapshotResponse> => {
    const { data } = await apiClient.post(FLOW_SNAPSHOTS_ENDPOINT, request);
    return data;
};

/**
 * Get flow snapshots by flow ID with pagination
 */
export const getFlowSnapshots = async ({
    flow_id,
    page = 1,
    per_page = 10,
}: GetFlowSnapshotsParams): Promise<FlowSnapshotListResponse> => {
    const { data } = await apiClient.get(FLOW_SNAPSHOTS_ENDPOINT, {
        params: { flow_id, page, per_page },
    });
    return data;
};

/**
 * Get a flow snapshot by ID
 */
export const getFlowSnapshotById = async (
    snapshotId: number
): Promise<GetFlowSnapshotResponse> => {
    const { data } = await apiClient.get(
        `${FLOW_SNAPSHOTS_ENDPOINT}/${snapshotId}`
    );
    return data;
};

/**
 * Get the current flow snapshot for a flow
 */
export const getCurrentFlowSnapshot = async (
    flowId: number
): Promise<GetFlowSnapshotResponse> => {
    const { data } = await apiClient.get(
        `${FLOW_SNAPSHOTS_ENDPOINT}/current/${flowId}`
    );
    return data;
};

/**
 * Update a flow snapshot
 */
export const updateFlowSnapshot = async (
    snapshotId: number,
    request: Partial<CreateFlowSnapshotRequest>
): Promise<GetFlowSnapshotResponse> => {
    const { data } = await apiClient.patch(
        `${FLOW_SNAPSHOTS_ENDPOINT}/${snapshotId}`,
        {
            ...request,
            id: snapshotId,
        }
    );
    return data;
};

/**
 * Set a flow snapshot as the current version
 */
export const setCurrentFlowSnapshot = async (
    snapshotId: number
): Promise<{
    success: boolean;
    message: string;
    current_snapshot_id: number;
}> => {
    const { data } = await apiClient.post(
        `${FLOW_SNAPSHOTS_ENDPOINT}/set-current`,
        {
            snapshot_id: snapshotId,
        }
    );
    return data;
};

/**
 * Delete a flow snapshot
 */
export const deleteFlowSnapshot = async (snapshotId: number): Promise<void> => {
    await apiClient.delete(`${FLOW_SNAPSHOTS_ENDPOINT}/${snapshotId}`);
};
