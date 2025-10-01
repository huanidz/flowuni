import { create } from 'zustand';
import type { TestCaseRunStatus } from '../types';

interface TestCaseUpdate {
    status?: TestCaseRunStatus;
    error_message?: string | null;
    chat_output?: Record<string, any> | null;
}

interface TestCaseStatusState {
    // Map of test case IDs to their current run status
    testCaseStatuses: Record<string, TestCaseRunStatus>;

    // Map of test case IDs to their error messages
    testCaseErrorMessages: Record<string, string | null>;

    // Map of test case IDs to their chat output
    testCaseChatOutputs: Record<string, Record<string, any> | null>;

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
    // NEW: Batch update with all fields
    updateMultipleTestCaseFields: (
        updates: Map<string, TestCaseUpdate>
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
        testCaseErrorMessages: {},
        testCaseChatOutputs: {},
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

        // NEW: Batch update with all fields
        updateMultipleTestCaseFields: (
            updates: Map<string, TestCaseUpdate>
        ) => {
            set(state => {
                const newStatuses = { ...state.testCaseStatuses };
                const newErrorMessages = { ...state.testCaseErrorMessages };
                const newChatOutputs = { ...state.testCaseChatOutputs };

                updates.forEach((update, testCaseId) => {
                    if (update.status !== undefined) {
                        newStatuses[testCaseId] = update.status;
                    }
                    if (update.error_message !== undefined) {
                        newErrorMessages[testCaseId] = update.error_message;
                    }
                    if (update.chat_output !== undefined) {
                        newChatOutputs[testCaseId] = update.chat_output;
                    }
                });

                return {
                    testCaseStatuses: newStatuses,
                    testCaseErrorMessages: newErrorMessages,
                    testCaseChatOutputs: newChatOutputs,
                };
            });
        },

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
            set(state => {
                // Remove any existing task mappings for this test case
                const newTaskMap = { ...state.taskToTestCaseMap };
                Object.entries(newTaskMap).forEach(
                    ([existingTaskId, mappedTestCaseId]) => {
                        if (mappedTestCaseId === testCaseId) {
                            delete newTaskMap[existingTaskId];
                        }
                    }
                );

                // Add the new task mapping
                newTaskMap[taskId] = testCaseId;

                return {
                    taskToTestCaseMap: newTaskMap,
                };
            });
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
    useTestCaseStatusStore(state => {
        // Find the task ID for this test case by checking all task mappings
        return Object.entries(state.taskToTestCaseMap).find(
            ([_, mappedTestCaseId]) => mappedTestCaseId === testCaseId
        )?.[0];
    });

export const useAllTestCaseStatuses = () =>
    useTestCaseStatusStore(state => state.testCaseStatuses);

// NEW: Selector hooks for error messages and chat output
export const useTestCaseErrorMessage = (testCaseId: string) =>
    useTestCaseStatusStore(
        state => state.testCaseErrorMessages[testCaseId] || null
    );

export const useTestCaseChatOutput = (testCaseId: string) =>
    useTestCaseStatusStore(
        state => state.testCaseChatOutputs[testCaseId] || null
    );

export const useAllTestCaseErrorMessages = () =>
    useTestCaseStatusStore(state => state.testCaseErrorMessages);

export const useAllTestCaseChatOutputs = () =>
    useTestCaseStatusStore(state => state.testCaseChatOutputs);
