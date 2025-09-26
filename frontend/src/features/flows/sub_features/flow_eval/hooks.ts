import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import useAuthStore from '@/features/auth/store';
import { TestCaseRunStatus } from './types';

import {
    createTestSuite,
    createTestCase,
    deleteTestSuite,
    deleteTestCase,
    getTestSuitesWithCases,
    partialUpdateTestCase,
    partialUpdateTestSuite,
    runSingleTest,
} from './api';
import { watchUserEvents } from './sse';
import type {
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
 * Hook for partially updating a test suite
 */
export const usePartialUpdateTestSuite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            suiteId,
            request,
            flowId,
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
    const queryClient = useQueryClient();
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
 * Hook for watching user events via SSE
 */

export const useWatchFlowTestEvents = (taskId: string | null) => {
    const eventSourceRef = useRef<EventSource | null>(null);
    const { updateTestCaseStatusByTaskId, updateTestCaseStatus } =
        useTestCaseStatusStore();
    const { user_id } = useAuthStore();

    useEffect(() => {
        if (!user_id) {
            console.warn('User ID not found, cannot set up SSE connection');
            return;
        }

        console.log(`Setting up SSE connection for user: ${user_id}`);

        eventSourceRef.current = watchUserEvents(
            user_id,
            (message: any) => {
                console.log('Received SSE message:', message);

                // Handle different types of SSE events
                if (message.event === 'USER_EVENT') {
                    // Update test case status based on the event data
                    const { payload, event_type } = message.data || {};

                    if (event_type === 'TEST_CASE_STATUS_UPDATE') {
                        const { case_id, status } = payload || {};

                        // Update the test case status
                        if (case_id && status) {
                            updateTestCaseStatus(
                                String(case_id),
                                status as TestCaseRunStatus
                            );
                        }
                    }
                } else if (message.event === 'DONE') {
                    // The entire task is done
                    console.log('SSE stream completed for user:', user_id);
                }
            },
            (error: Event) => {
                console.error('SSE connection error:', error);
                // If there's a connection error, mark the test case as having a system error
            }
        );

        // Cleanup function to close the connection when component unmounts or user_id changes
        return () => {
            if (eventSourceRef.current) {
                console.log('Closing SSE connection');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [user_id]);

    return { eventSource: eventSourceRef.current };
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
