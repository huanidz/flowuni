import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createFlowSnapshot,
    getFlowSnapshots,
    getFlowSnapshotById,
    getCurrentFlowSnapshot,
    updateFlowSnapshot,
    setCurrentFlowSnapshot,
    deleteFlowSnapshot,
} from './api';
import type {
    CreateFlowSnapshotRequest,
    GetFlowSnapshotsParams,
    FlowSnapshotListResponse,
    GetFlowSnapshotResponse,
} from './types';

// Query keys
export const FLOW_SNAPSHOTS_QUERY_KEYS = {
    all: ['flowSnapshots'] as const,
    lists: () => [...FLOW_SNAPSHOTS_QUERY_KEYS.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
        [...FLOW_SNAPSHOTS_QUERY_KEYS.lists(), { filters }] as const,
    details: () => [...FLOW_SNAPSHOTS_QUERY_KEYS.all, 'detail'] as const,
    detail: (id: number) =>
        [...FLOW_SNAPSHOTS_QUERY_KEYS.details(), id] as const,
    current: (flowId: number) =>
        [...FLOW_SNAPSHOTS_QUERY_KEYS.all, 'current', flowId] as const,
};

/**
 * Hook for getting flow snapshots by flow ID with pagination
 */
export const useFlowSnapshots = ({
    flow_id,
    page = 1,
    per_page = 10,
}: GetFlowSnapshotsParams) => {
    return useQuery<FlowSnapshotListResponse, Error>({
        queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.list({ flow_id, page, per_page }),
        queryFn: () => getFlowSnapshots({ flow_id, page, per_page }),
        enabled: !!flow_id,
        placeholderData: previousData => previousData,
    });
};

/**
 * Hook for getting a single flow snapshot by ID
 */
export const useFlowSnapshot = (snapshotId: number) => {
    return useQuery<GetFlowSnapshotResponse, Error>({
        queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.detail(snapshotId),
        queryFn: () => getFlowSnapshotById(snapshotId),
        enabled: !!snapshotId,
    });
};

/**
 * Hook for getting the current flow snapshot for a flow
 */
export const useCurrentFlowSnapshot = (flowId: number) => {
    return useQuery<GetFlowSnapshotResponse, Error>({
        queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.current(flowId),
        queryFn: () => getCurrentFlowSnapshot(flowId),
        enabled: !!flowId,
    });
};

/**
 * Hook for creating a flow snapshot
 */
export const useCreateFlowSnapshot = () => {
    const queryClient = useQueryClient();

    return useMutation<
        GetFlowSnapshotResponse,
        Error,
        CreateFlowSnapshotRequest
    >({
        mutationFn: createFlowSnapshot,
        onSuccess: (data, variables) => {
            // Invalidate the list query for this flow
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.lists(),
            });

            // Invalidate the current snapshot query for this flow
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.current(variables.flow_id),
            });
        },
    });
};

/**
 * Hook for updating a flow snapshot
 */
export const useUpdateFlowSnapshot = () => {
    const queryClient = useQueryClient();

    return useMutation<
        GetFlowSnapshotResponse,
        Error,
        { snapshotId: number; data: Partial<CreateFlowSnapshotRequest> }
    >({
        mutationFn: ({ snapshotId, data }) =>
            updateFlowSnapshot(snapshotId, data),
        onSuccess: (data, variables) => {
            // Invalidate the detail query for this snapshot
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.detail(
                    variables.snapshotId
                ),
            });

            // Invalidate the list query for this flow
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.lists(),
            });

            // Invalidate the current snapshot query for this flow
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.current(data.flow_id),
            });
        },
    });
};

/**
 * Hook for setting a flow snapshot as the current version
 */
export const useSetCurrentFlowSnapshot = () => {
    const queryClient = useQueryClient();

    return useMutation<
        { success: boolean; message: string; current_snapshot_id: number },
        Error,
        number
    >({
        mutationFn: setCurrentFlowSnapshot,
        onSuccess: (data, snapshotId) => {
            // We need to get the flow ID from the snapshot data
            // Since we don't have it directly, we'll invalidate all list queries
            // and the current snapshot queries will be invalidated when the component
            // using this hook gets the updated data

            // Invalidate all list queries
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.lists(),
            });

            // Invalidate the detail query for this snapshot
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.detail(snapshotId),
            });
        },
    });
};

/**
 * Hook for deleting a flow snapshot
 */
export const useDeleteFlowSnapshot = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: deleteFlowSnapshot,
        onSuccess: (_, snapshotId) => {
            // We need to get the flow ID from the snapshot data
            // Since we don't have it directly, we'll invalidate all list queries

            // Invalidate all list queries
            queryClient.invalidateQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.lists(),
            });

            // Remove the detail query for this snapshot
            queryClient.removeQueries({
                queryKey: FLOW_SNAPSHOTS_QUERY_KEYS.detail(snapshotId),
            });
        },
    });
};
