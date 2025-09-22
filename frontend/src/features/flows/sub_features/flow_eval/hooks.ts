import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    createTestSuite,
    deleteTestSuite,
    getTestSuitesWithCases,
} from './api';
import type { TestSuiteCreateRequest } from './types';

/**
 * Hook for fetching test suites with cases for a specific flow
 */
export const useTestSuitesWithCases = (flowId: string) => {
    return useQuery({
        queryKey: ['testSuitesWithCases', flowId],
        queryFn: () => getTestSuitesWithCases(flowId),
        enabled: !!flowId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook for creating a new test suite
 */
export const useCreateTestSuite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: TestSuiteCreateRequest) =>
            createTestSuite(request),
        onSuccess: (data, variables) => {
            // Invalidate and refetch test suites for this flow
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases', variables.flow_id],
            });
            toast.success('Test suite created successfully');
        },
        onError: error => {
            console.error('Error creating test suite:', error);
            toast.error('Failed to create test suite');
        },
    });
};

/**
 * Hook for deleting a test suite
 */
export const useDeleteTestSuite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            suiteId,
            flowId,
        }: {
            suiteId: number;
            flowId: string;
        }) => deleteTestSuite(suiteId),
        onSuccess: (_, variables) => {
            // Invalidate and refetch test suites for this flow
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases', variables.flowId],
            });
            toast.success('Test suite deleted successfully');
        },
        onError: error => {
            console.error('Error deleting test suite:', error);
            toast.error('Failed to delete test suite');
        },
    });
};
