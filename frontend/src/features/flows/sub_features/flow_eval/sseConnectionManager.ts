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
    setUpdateFunctions: (functions: {
        updateTestCaseStatus: (
            caseIdStr: string,
            statusValue: TestCaseRunStatus
        ) => void;
        updateQueryData: (
            caseIdStr: string,
            statusValue: TestCaseRunStatus
        ) => void;
    }) => void;
}

// Global singleton instance
let globalSSEManager: SSEConnectionManager | null = null;

// Helper functions to manage the last event ID
const getLastEventId = (): string => {
    try {
        if (typeof localStorage !== 'undefined') {
            const lastEventId = localStorage.getItem(LAST_EVENT_ID_KEY);
            // Return the stored ID or '0-0' if not found (valid Redis start)
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

    // Track current user id to support reconnects
    const userIdRef = { current: null as number | null };

    // Store references to update functions that will be set by the hook
    const updateFunctionsRef = {
        updateTestCaseStatus: (
            caseIdStr: string,
            statusValue: TestCaseRunStatus
        ) => {
            console.log('updateTestCaseStatus not properly initialized');
        },
        updateQueryData: (
            caseIdStr: string,
            statusValue: TestCaseRunStatus
        ) => {
            console.log('updateQueryData not properly initialized');
        },
    };

    const reconnectNow = (forceSinceId?: string) => {
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
        console.log('Received SSE message:', message);

        // Persist last processed ID; prefer explicit id, else browser lastEventId pass-through
        const effectiveId =
            (typeof message.id === 'string' && message.id) ||
            (typeof message.__lastEventId === 'string' &&
                message.__lastEventId) ||
            null;
        if (effectiveId) setLastEventId(effectiveId);

        // Handle ERROR events from server — e.g., invalid stream id
        if (message.event === 'ERROR') {
            const errMsg = String(message.error || '');
            if (/Invalid stream ID/i.test(errMsg)) {
                console.warn(
                    'Server reported invalid stream ID; resetting to 0-0 and reconnecting.'
                );
                setLastEventId('0-0');
                // Explicit reconnect; do not wait for native retry since connection is open
                reconnectNow('0-0');
                return;
            }
        }

        // Handle USER_EVENT; server payload structure: event_type at top level, data contains the event_data
        if (message.event === 'USER_EVENT') {
            const { event_type, data } = message || {};
            if (event_type === 'TEST_CASE_STATUS_UPDATE') {
                const { case_id, status } = data?.payload ?? data ?? {};
                if (case_id && status) {
                    const caseIdStr = String(case_id);
                    const statusValue = status as TestCaseRunStatus;
                    updateFunctionsRef.updateTestCaseStatus(
                        caseIdStr,
                        statusValue
                    );
                    updateFunctionsRef.updateQueryData(caseIdStr, statusValue);
                }
            }
        } else if (message.event === 'DONE') {
            console.log('SSE stream completed by server');
        }

        // Forward to external handlers
        messageHandlersRef.current.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in SSE message handler:', error);
            }
        });
    };

    const handleError = (error: Event) => {
        console.error('SSE connection error:', error);
        // Do not close; EventSource will auto-retry.
        // If you want proactive manual reconnect backoff, you can do:
        // setTimeout(() => {
        //   reconnectNow();
        //   backoffRef.current = Math.min(backoffRef.current * 2, backoffCap);
        // }, backoffRef.current);
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
                lastEventId // Resume from last known message
            );

            manager.eventSource = eventSourceRef.current;
        },
        disconnect: () => {
            // Keep-alive strategy; no-op by design
            console.log('SSE connection will remain active for the session');
        },
        addMessageHandler: (handler: (message: any) => void) => {
            messageHandlersRef.current.add(handler);
        },
        removeMessageHandler: (handler: (message: any) => void) => {
            messageHandlersRef.current.delete(handler);
        },
        setUpdateFunctions: (functions: {
            updateTestCaseStatus: (
                caseIdStr: string,
                statusValue: TestCaseRunStatus
            ) => void;
            updateQueryData: (
                caseIdStr: string,
                statusValue: TestCaseRunStatus
            ) => void;
        }) => {
            updateFunctionsRef.updateTestCaseStatus =
                functions.updateTestCaseStatus;
            updateFunctionsRef.updateQueryData = functions.updateQueryData;
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
    const { updateTestCaseStatus } = useTestCaseStatusStore.getState();
    const queryClient = useQueryClient();
    const manager = getSSEConnectionManager();

    React.useEffect(() => {
        manager.setUpdateFunctions({
            updateTestCaseStatus: (
                caseIdStr: string,
                statusValue: TestCaseRunStatus
            ) => {
                updateTestCaseStatus(caseIdStr, statusValue);
            },
            updateQueryData: (
                caseIdStr: string,
                statusValue: TestCaseRunStatus
            ) => {
                // Update the React Query cache to reflect the new latest_run_status
                queryClient.setQueriesData(
                    { queryKey: ['testSuitesWithCases'] },
                    (oldData: any) => {
                        if (!oldData) return oldData;
                        const newData = JSON.parse(JSON.stringify(oldData));
                        if (newData.test_suites) {
                            newData.test_suites.forEach((suite: any) => {
                                if (suite.test_cases) {
                                    suite.test_cases.forEach(
                                        (testCase: any) => {
                                            if (
                                                String(testCase.id) ===
                                                caseIdStr
                                            ) {
                                                testCase.latest_run_status =
                                                    statusValue;
                                            }
                                        }
                                    );
                                }
                            });
                        }
                        return newData;
                    }
                );
            },
        });
    }, [manager, updateTestCaseStatus, queryClient]);

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
