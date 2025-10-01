import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { TestCaseRunStatus } from './types';

import {
    cancelBatchTest,
    cancelSingleTest,
    createTestSuite,
    createTestCase,
    deleteTestSuite,
    deleteTestCase,
    getTestSuitesWithCases,
    partialUpdateTestCase,
    partialUpdateTestSuite,
    runBatchTest,
    runSingleTest,
} from './api';
import type {
    FlowBatchTestCancelRequest,
    FlowBatchTestRunRequest,
    FlowTestCancelRequest,
    FlowTestRunRequest,
    TestCaseCreateRequest,
    TestCasePartialUpdateRequest,
    TestSuiteCreateRequest,
    TestSuitePartialUpdateRequest,
} from './types';
import { useTestCaseStatusStore } from './stores/testCaseStatusStore';

/**
 * Hook for fetching test suites with cases for a specific flow
 */
export const useTestSuitesWithCases = (flowId: string) => {
    const { updateTestCaseStatus } = useTestCaseStatusStore();

    const query = useQuery({
        queryKey: ['testSuitesWithCases', flowId],
        queryFn: () => getTestSuitesWithCases(flowId),
        enabled: !!flowId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Use useEffect to update the store when data changes
    useEffect(() => {
        if (query.data) {
            // Collect all test case IDs from the new data
            console.log('query.data: ', query.data);
            const currentTestCaseIds = new Set<string>();
            query.data.test_suites.forEach(suite => {
                suite.test_cases.forEach(testCase => {
                    currentTestCaseIds.add(String(testCase.id));

                    // Update the store with the latest test case status from the API
                    if (testCase.latest_run_status) {
                        updateTestCaseStatus(
                            String(testCase.id),
                            testCase.latest_run_status
                        );
                    }
                });
            });

            // Only reset statuses for test cases that are no longer present
            // This preserves statuses during refetches and prevents UI flickering
            const { testCaseStatuses, resetTestCaseStatus } =
                useTestCaseStatusStore.getState();
            Object.keys(testCaseStatuses).forEach(testCaseId => {
                if (!currentTestCaseIds.has(testCaseId)) {
                    resetTestCaseStatus(testCaseId);
                }
            });
        }
    }, [query.data, updateTestCaseStatus]);

    return query;
};

/**
 * Hook for creating a new test suite
 */
export const useCreateTestSuite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: TestSuiteCreateRequest) =>
            createTestSuite(request),
        onSuccess: (_data, variables) => {
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
        onSuccess: (_data, _variables) => {
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
 * Hook for partially updating a test suite
 */
export const usePartialUpdateTestSuite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            suiteId,
            request,
        }: {
            suiteId: number;
            request: TestSuitePartialUpdateRequest;
            flowId: string;
        }) => partialUpdateTestSuite(suiteId, request),
        onSuccess: (_, variables) => {
            // Invalidate and refetch test suites for this flow
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases', variables.flowId],
            });
            toast.success('Test suite updated successfully');
        },
        onError: error => {
            console.error('Error updating test suite:', error);
            toast.error('Failed to update test suite');
        },
    });
};

/**
 * Hook for running a single test case
 */
export const useRunSingleTest = () => {
    const { setTaskTestCaseMapping, updateTestCaseStatus } =
        useTestCaseStatusStore();

    return useMutation({
        mutationFn: (request: FlowTestRunRequest) => runSingleTest(request),
        onSuccess: (data, variables) => {
            // Map the task ID to the test case ID
            setTaskTestCaseMapping(data.task_id, String(variables.case_id));

            // Set initial status to QUEUED
            updateTestCaseStatus(
                String(variables.case_id),
                TestCaseRunStatus.QUEUED
            );

            // Invalidate and refetch test suites for this flow
            // queryClient.invalidateQueries({
            //     queryKey: ['testSuitesWithCases', variables.flow_id],
            // });
            // toast.success('Test case run initiated successfully');
        },
        onError: error => {
            console.error('Error running test case:', error);

            // Handle 409 Conflict error (test case already running or queued)
            if (
                error &&
                typeof error === 'object' &&
                'status' in error &&
                error.status === 409
            ) {
                const errorMessage =
                    'detail' in error && typeof error.detail === 'string'
                        ? error.detail
                        : 'Test case is already running or queued';
                toast.error(errorMessage);
            } else {
                toast.error('Failed to run test case');
            }
        },
    });
};

/**
 * Hook for running a batch of test cases
 */
export const useRunBatchTest = () => {
    const queryClient = useQueryClient();
    const { setTaskTestCaseMapping, updateTestCaseStatus } =
        useTestCaseStatusStore();

    return useMutation({
        mutationFn: (request: FlowBatchTestRunRequest) => runBatchTest(request),
        onSuccess: (data, variables) => {
            // Map each task ID to its corresponding test case ID
            data.task_ids.forEach((taskId, index) => {
                const caseId = data.case_ids[index];
                setTaskTestCaseMapping(taskId, String(caseId));

                // Set initial status to QUEUED for each test case
                updateTestCaseStatus(String(caseId), TestCaseRunStatus.QUEUED);
            });

            // Invalidate and refetch test suites for this flow
            queryClient.invalidateQueries({
                queryKey: ['testSuitesWithCases', variables.flow_id],
            });

            // Check if some test cases were skipped (already running or queued)
            const requestedCount = variables.case_ids.length;
            const queuedCount = data.case_ids.length;

            if (requestedCount > queuedCount) {
                const skippedCount = requestedCount - queuedCount;
                toast.success(
                    `Batch test run initiated for ${queuedCount} test cases. ${skippedCount} test cases were skipped as they are already running or queued.`
                );
            } else {
                toast.success('Batch test run initiated successfully');
            }
        },
        onError: error => {
            console.error('Error running batch test:', error);
            toast.error('Failed to run batch test');
        },
    });
};

/**
 * Hook for cancelling a single test case
 */
export const useCancelSingleTest = () => {
    const { updateTestCaseStatus } = useTestCaseStatusStore();

    return useMutation({
        mutationFn: (request: FlowTestCancelRequest) =>
            cancelSingleTest(request),
        onSuccess: (data, variables) => {
            if (data.cancelled) {
                // Find the test case ID by checking all task mappings
                const { taskToTestCaseMap } = useTestCaseStatusStore.getState();
                const testCaseId = taskToTestCaseMap[variables.task_id];

                if (testCaseId) {
                    updateTestCaseStatus(
                        testCaseId,
                        TestCaseRunStatus.CANCELLED
                    );
                }

                toast.success('Test cancelled successfully');
            } else {
                toast.info(data.message || 'Test could not be cancelled');
            }
        },
        onError: error => {
            console.error('Error cancelling test case:', error);
            toast.error('Failed to cancel test case');
        },
    });
};

/**
 * Hook for cancelling a batch of test cases
 */
export const useCancelBatchTest = () => {
    const { updateTestCaseStatus } = useTestCaseStatusStore();

    return useMutation({
        mutationFn: (request: FlowBatchTestCancelRequest) =>
            cancelBatchTest(request),
        onSuccess: (data, _variables) => {
            // Update the status of successfully cancelled test cases
            const { taskToTestCaseMap } = useTestCaseStatusStore.getState();

            data.cancelled_task_ids.forEach(taskId => {
                const testCaseId = taskToTestCaseMap[taskId];
                if (testCaseId) {
                    updateTestCaseStatus(
                        testCaseId,
                        TestCaseRunStatus.CANCELLED
                    );
                }
            });

            if (data.total_cancelled > 0) {
                if (data.total_failed > 0) {
                    toast.warning(
                        `Cancelled ${data.total_cancelled} tests. ${data.total_failed} tests failed to cancel.`
                    );
                } else {
                    toast.success(
                        `Cancelled ${data.total_cancelled} tests successfully`
                    );
                }
            } else {
                toast.error('No tests could be cancelled');
            }
        },
        onError: error => {
            console.error('Error cancelling batch tests:', error);
            toast.error('Failed to cancel batch tests');
        },
    });
};

/**
 * Hook for deleting a test suite
 */
export const useDeleteTestSuite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ suiteId }: { suiteId: number; flowId: string }) =>
            deleteTestSuite(suiteId),
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
