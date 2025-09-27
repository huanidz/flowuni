// sseConnectionManager.ts
import React, { useCallback } from 'react';
import useAuthStore from '@/features/auth/store';
import { watchUserEvents } from './sse';
import { useTestCaseStatusStore } from './stores/testCaseStatusStore';
import type { TestCaseRunStatus } from './types';
import { LAST_EVENT_ID_KEY } from './const';
import { useQueryClient } from '@tanstack/react-query';

interface SSEConnectionManager {
    eventSource: EventSource | null;
    isConnected: boolean;
    connect: (userId: number) => void;
    disconnect: () => void;
    addMessageHandler: (handler: (message: any) => void) => void;
    removeMessageHandler: (handler: (message: any) => void) => void;
    // MODIFIED: We now expect a single function that can handle a batch of updates.
    setBatchUpdateFunction: (
        batchUpdateHandler: (updates: Map<string, TestCaseRunStatus>) => void
    ) => void;
}

// Global singleton instance
let globalSSEManager: SSEConnectionManager | null = null;

// Helper functions to manage the last event ID (unchanged)
const getLastEventId = (): string => {
    try {
        if (typeof localStorage !== 'undefined') {
            const lastEventId = localStorage.getItem(LAST_EVENT_ID_KEY);
            return lastEventId || '0-0';
        }
        return '0-0';
    } catch (error) {
        console.error('Error accessing localStorage:', error);
        return '0-0';
    }
};

const setLastEventId = (eventId: string): void => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LAST_EVENT_ID_KEY, eventId);
        }
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
};

const createSSEConnectionManager = (): SSEConnectionManager => {
    const eventSourceRef = { current: null as EventSource | null };
    const messageHandlersRef = { current: new Set<(message: any) => void>() };
    const userIdRef = { current: null as number | null };

    // --- NEW: Batching Logic ---
    // A Map to store updates. If we get multiple updates for the same test case,
    // we'll only store the latest one, which is a great optimization.
    let updateQueue = new Map<string, TestCaseRunStatus>();
    let animationFrameId: number | null = null;

    // A reference to the batch update function provided by the hook.
    let batchUpdateHandlerRef: {
        current: ((updates: Map<string, TestCaseRunStatus>) => void) | null;
    } = { current: null };

    // This function will be called by requestAnimationFrame to process the queue.
    const processBatch = () => {
        animationFrameId = null; // Clear the ID so a new frame can be requested.

        if (updateQueue.size === 0) {
            return; // Nothing to process
        }

        // Atomically swap the queue and clear the old one.
        // This prevents race conditions if new messages arrive while processing.
        const updatesToProcess = updateQueue;
        updateQueue = new Map<string, TestCaseRunStatus>();

        console.log(`🚀 Processing batch of ${updatesToProcess.size} updates.`);

        // Call the single, powerful batch update function.
        if (batchUpdateHandlerRef.current) {
            batchUpdateHandlerRef.current(updatesToProcess);
        } else {
            console.warn('Batch update handler not set!');
        }
    };
    // --- End of NEW Batching Logic ---

    const reconnectNow = (forceSinceId?: string) => {
        // ... (this function is unchanged)
        const uid = userIdRef.current;
        if (!uid) return;
        try {
            eventSourceRef.current?.close();
        } catch {}
        const sinceId = forceSinceId ?? getLastEventId();
        console.log(`🔁 Reconnecting SSE for user ${uid} from ID: ${sinceId}`);
        eventSourceRef.current = watchUserEvents(
            uid,
            handleMessage,
            handleError,
            sinceId
        );
        manager.eventSource = eventSourceRef.current;
    };

    const handleMessage = (message: any) => {
        // The console log will still fire for every message, which is what we want for debugging.
        console.log('Received SSE message:', message);

        const effectiveId =
            (typeof message.id === 'string' && message.id) ||
            (typeof message.__lastEventId === 'string' &&
                message.__lastEventId) ||
            null;

        if (effectiveId) setLastEventId(effectiveId);

        if (message.event === 'ERROR') {
            const errMsg = String(message.error || '');
            if (/Invalid stream ID/i.test(errMsg)) {
                console.warn(
                    'Server reported invalid stream ID; resetting to 0-0 and reconnecting.'
                );
                setLastEventId('0-0');
                reconnectNow('0-0');
                return;
            }
        }

        if (message.event === 'USER_EVENT') {
            const { event_type, data } = message || {};
            if (event_type === 'TEST_CASE_STATUS_UPDATE') {
                const { case_id, status } = data?.payload ?? data ?? {};
                if (case_id && status) {
                    const caseIdStr = String(case_id);
                    const statusValue = status as TestCaseRunStatus;

                    // --- MODIFIED: Instead of updating state directly, add to the queue. ---
                    updateQueue.set(caseIdStr, statusValue);

                    // Schedule a batch process if one isn't already scheduled for the next frame.
                    if (!animationFrameId) {
                        animationFrameId = requestAnimationFrame(processBatch);
                    }
                    // --- End of MODIFICATION ---
                }
            }
        } else if (message.event === 'DONE') {
            console.log('SSE stream completed by server');
        }

        messageHandlersRef.current.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in SSE message handler:', error);
            }
        });
    };

    const handleError = (error: Event) => {
        // ... (this function is unchanged)
        console.error('SSE connection error:', error);
    };

    const manager: SSEConnectionManager = {
        eventSource: eventSourceRef.current,
        get isConnected() {
            return (
                eventSourceRef.current !== null &&
                eventSourceRef.current.readyState === EventSource.OPEN
            );
        },
        connect: (userId: number) => {
            // ... (this function is unchanged)
            if (eventSourceRef.current) {
                console.log('SSE connection already exists, reusing it');
                return;
            }
            userIdRef.current = userId;
            console.log(`Setting up global SSE connection for user: ${userId}`);
            const lastEventId = getLastEventId();
            console.log(`Resuming from event ID: ${lastEventId}`);
            eventSourceRef.current = watchUserEvents(
                userId,
                handleMessage,
                handleError,
                lastEventId
            );
            manager.eventSource = eventSourceRef.current;
        },
        disconnect: () => {
            // ... (this function is unchanged)
            console.log('SSE connection will remain active for the session');
        },
        addMessageHandler: (handler: (message: any) => void) => {
            messageHandlersRef.current.add(handler);
        },
        removeMessageHandler: (handler: (message: any) => void) => {
            messageHandlersRef.current.delete(handler);
        },
        // MODIFIED: Renamed and simplified this method.
        setBatchUpdateFunction: (
            handler: (updates: Map<string, TestCaseRunStatus>) => void
        ) => {
            batchUpdateHandlerRef.current = handler;
        },
    };
    return manager;
};

export const getSSEConnectionManager = (): SSEConnectionManager => {
    if (!globalSSEManager) {
        globalSSEManager = createSSEConnectionManager();
    }
    return globalSSEManager;
};

// Hook to use the global SSE connection
export const useGlobalSSEConnection = () => {
    const { user_id } = useAuthStore();
    // MODIFIED: Zustand's update function isn't called directly from the manager anymore.
    const { updateMultipleTestCaseStatuses } =
        useTestCaseStatusStore.getState();
    const queryClient = useQueryClient();
    const manager = getSSEConnectionManager();

    React.useEffect(() => {
        // MODIFIED: We now provide ONE function that knows how to handle a batch.
        manager.setBatchUpdateFunction(
            (updates: Map<string, TestCaseRunStatus>) => {
                // 1. Update Zustand store in one go.
                // You'll need to implement `updateMultipleTestCaseStatuses` in your store.
                updateMultipleTestCaseStatuses(updates);

                // 2. Update React Query cache in one go.
                queryClient.setQueriesData(
                    { queryKey: ['testSuitesWithCases'] },
                    (oldData: any) => {
                        if (!oldData) return oldData;

                        // Using structuredClone is more robust than JSON.parse(JSON.stringify(...))
                        // but you could also use an immutability library like Immer here.
                        const newData = structuredClone(oldData);

                        if (newData.test_suites) {
                            // Create a quick lookup map for faster updates if you have many test cases
                            const caseMap = new Map();
                            newData.test_suites.forEach((suite: any) => {
                                suite.test_cases?.forEach((testCase: any) => {
                                    caseMap.set(String(testCase.id), testCase);
                                });
                            });

                            // Iterate over the batch of updates and apply them
                            updates.forEach((statusValue, caseIdStr) => {
                                const testCase = caseMap.get(caseIdStr);
                                if (testCase) {
                                    testCase.latest_run_status = statusValue;
                                }
                            });
                        }
                        return newData;
                    }
                );
            }
        );
    }, [manager, updateMultipleTestCaseStatuses, queryClient]);

    const connect = useCallback(() => {
        if (user_id) {
            manager.connect(user_id);
        }
    }, [user_id, manager]);

    return {
        connect,
        disconnect: manager.disconnect,
        isConnected: manager.isConnected,
        addMessageHandler: manager.addMessageHandler,
        removeMessageHandler: manager.removeMessageHandler,
    };
};
