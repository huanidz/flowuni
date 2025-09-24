import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    createTestSuite,
    createTestCase,
    deleteTestSuite,
    deleteTestCase,
    getTestSuitesWithCases,
    partialUpdateTestCase,
    runSingleTest,
} from './api';
import type {
    FlowTestRunRequest,
    TestCaseCreateRequest,
    TestCasePartialUpdateRequest,
    TestSuiteCreateRequest,
} from './types';

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
 * Hook for creating a new test case
 */
export const useCreateTestCase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: TestCaseCreateRequest) => createTestCase(request),
        onSuccess: (data, variables) => {
            // Invalidate and refetch test suites for this flow
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases'],
            });
            toast.success('Test case created successfully');
        },
        onError: error => {
            console.error('Error creating test case:', error);
            toast.error('Failed to create test case');
        },
    });
};

/**
 * Hook for deleting a test case
 */
export const useDeleteTestCase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (caseId: number) => deleteTestCase(caseId),
        onSuccess: () => {
            // Invalidate and refetch test suites
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases'],
            });
            toast.success('Test case deleted successfully');
        },
        onError: error => {
            console.error('Error deleting test case:', error);
            toast.error('Failed to delete test case');
        },
    });
};

/**
 * Hook for partially updating a test case
 */
export const usePartialUpdateTestCase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            caseId,
            request,
        }: {
            caseId: number;
            request: TestCasePartialUpdateRequest;
        }) => partialUpdateTestCase(caseId, request),
        onSuccess: () => {
            // Invalidate and refetch test suites
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases'],
            });
            toast.success('Test case updated successfully');
        },
        onError: error => {
            console.error('Error updating test case:', error);
            toast.error('Failed to update test case');
        },
    });
};

/**
 * Hook for running a single test case
 */
export const useRunSingleTest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: FlowTestRunRequest) => runSingleTest(request),
        onSuccess: (data, variables) => {
            // Invalidate and refetch test suites for this flow
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases', variables.flow_id],
            });
            toast.success('Test case run initiated successfully');
        },
        onError: error => {
            console.error('Error running test case:', error);
            toast.error('Failed to run test case');
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
