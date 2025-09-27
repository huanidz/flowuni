import { create } from 'zustand';
import type { TestCaseRunStatus } from '../types';

interface TestCaseStatusState {
    // Map of test case IDs to their current run status
    testCaseStatuses: Record<string, TestCaseRunStatus>;

    // Map of task IDs to the test case IDs they're running
    taskToTestCaseMap: Record<string, string>;

    // Actions
    updateTestCaseStatus: (
        testCaseId: string,
        status: TestCaseRunStatus
    ) => void;
    // ADDED: New action for batch updates
    updateMultipleTestCaseStatuses: (
        updates: Map<string, TestCaseRunStatus>
    ) => void;
    updateTestCaseStatusByTaskId: (
        taskId: string,
        status: TestCaseRunStatus
    ) => void;
    setTaskTestCaseMapping: (taskId: string, testCaseId: string) => void;
    resetAllStatuses: () => void;
    resetTestCaseStatus: (testCaseId: string) => void;
    getTestCaseStatus: (testCaseId: string) => TestCaseRunStatus;
    getTaskIdForTestCase: (testCaseId: string) => string | undefined;
}

const defaultStatus: TestCaseRunStatus = 'PENDING';

export const useTestCaseStatusStore = create<TestCaseStatusState>(
    (set, get) => ({
        testCaseStatuses: {},
        taskToTestCaseMap: {},

        updateTestCaseStatus: (
            testCaseId: string,
            status: TestCaseRunStatus
        ) => {
            set(state => ({
                testCaseStatuses: {
                    ...state.testCaseStatuses,
                    [testCaseId]: status,
                },
            }));
        },

        // --- 👇 NEW BATCH ACTION ---
        /**
         * Efficiently updates multiple test case statuses in a single operation.
         * This triggers only one re-render for components subscribed to the store,
         * preventing UI lag from rapid, individual updates.
         */
        updateMultipleTestCaseStatuses: (
            updates: Map<string, TestCaseRunStatus>
        ) => {
            set(state => ({
                testCaseStatuses: {
                    ...state.testCaseStatuses,
                    // Convert the Map to an object and spread it to merge updates
                    ...Object.fromEntries(updates),
                },
            }));
        },
        // --- END OF NEW BATCH ACTION ---

        updateTestCaseStatusByTaskId: (
            taskId: string,
            status: TestCaseRunStatus
        ) => {
            const state = get();
            const testCaseId = state.taskToTestCaseMap[taskId];

            if (testCaseId) {
                set(currentState => ({
                    testCaseStatuses: {
                        ...currentState.testCaseStatuses,
                        [testCaseId]: status,
                    },
                }));
            }
        },

        setTaskTestCaseMapping: (taskId: string, testCaseId: string) => {
            set(state => ({
                taskToTestCaseMap: {
                    ...state.taskToTestCaseMap,
                    [taskId]: testCaseId,
                },
            }));
        },

        resetAllStatuses: () => {
            set({
                testCaseStatuses: {},
                taskToTestCaseMap: {},
            });
        },

        resetTestCaseStatus: (testCaseId: string) => {
            set(state => {
                const newStatuses = { ...state.testCaseStatuses };
                delete newStatuses[testCaseId];

                // Also remove any task mappings for this test case
                const newTaskMap = { ...state.taskToTestCaseMap };
                Object.entries(newTaskMap).forEach(
                    ([taskId, mappedTestCaseId]) => {
                        if (mappedTestCaseId === testCaseId) {
                            delete newTaskMap[taskId];
                        }
                    }
                );

                return {
                    testCaseStatuses: newStatuses,
                    taskToTestCaseMap: newTaskMap,
                };
            });
        },

        getTestCaseStatus: (testCaseId: string) => {
            const state = get();
            return state.testCaseStatuses[testCaseId] || defaultStatus;
        },

        getTaskIdForTestCase: (testCaseId: string) => {
            const state = get();
            return Object.entries(state.taskToTestCaseMap).find(
                ([_, mappedTestCaseId]) => mappedTestCaseId === testCaseId
            )?.[0];
        },
    })
);

// Selector hooks for optimized performance (unchanged)
export const useTestCaseStatus = (testCaseId: string) =>
    useTestCaseStatusStore(state => state.getTestCaseStatus(testCaseId));

export const useTaskIdForTestCase = (testCaseId: string) =>
    useTestCaseStatusStore(state => state.getTaskIdForTestCase(testCaseId));

export const useAllTestCaseStatuses = () =>
    useTestCaseStatusStore(state => state.testCaseStatuses);
