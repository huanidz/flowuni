import useAuthStore from '@/features/auth/store';
import { watchUserEvents } from './sse';
import { useTestCaseStatusStore } from './stores/testCaseStatusStore';
import type { TestCaseRunStatus } from './types';

interface SSEConnectionManager {
    eventSource: EventSource | null;
    isConnected: boolean;
    connect: (userId: number) => void;
    disconnect: () => void;
    addMessageHandler: (handler: (message: any) => void) => void;
    removeMessageHandler: (handler: (message: any) => void) => void;
}

// Global singleton instance
let globalSSEManager: SSEConnectionManager | null = null;

const createSSEConnectionManager = (): SSEConnectionManager => {
    // Use regular object references instead of React hooks
    const eventSourceRef = { current: null as EventSource | null };
    const messageHandlersRef = { current: new Set<(message: any) => void>() };
    const { updateTestCaseStatus, updateTestCaseStatusByTaskId } =
        useTestCaseStatusStore.getState();

    const handleMessage = (message: any) => {
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
            console.log('SSE stream completed');
        }

        // Forward message to all registered handlers
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
        // If there's a connection error, we'll let the individual components handle it
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

            console.log(`Setting up global SSE connection for user: ${userId}`);

            eventSourceRef.current = watchUserEvents(
                userId,
                handleMessage,
                handleError
            );

            // Update the eventSource property
            manager.eventSource = eventSourceRef.current;
        },
        disconnect: () => {
            // We don't actually disconnect to maintain the connection throughout the session
            // This ensures the SSE connection persists even when LCEvalContent is closed
            console.log('SSE connection will remain active for the session');
        },
        addMessageHandler: (handler: (message: any) => void) => {
            messageHandlersRef.current.add(handler);
        },
        removeMessageHandler: (handler: (message: any) => void) => {
            messageHandlersRef.current.delete(handler);
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
    const manager = getSSEConnectionManager();

    const connect = () => {
        if (user_id) {
            manager.connect(user_id);
        }
    };

    return {
        connect,
        disconnect: manager.disconnect,
        isConnected: manager.isConnected,
        addMessageHandler: manager.addMessageHandler,
        removeMessageHandler: manager.removeMessageHandler,
    };
};
