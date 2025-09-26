import useAuthStore from '@/features/auth/store';
import { watchUserEvents } from './sse';
import { useTestCaseStatusStore } from './stores/testCaseStatusStore';
import type { TestCaseRunStatus } from './types';
import { LAST_EVENT_ID_KEY } from './const';

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

// Helper functions to manage the last event ID
const getLastEventId = (): string => {
    try {
        // Check if localStorage is available
        if (typeof localStorage !== 'undefined') {
            const lastEventId = localStorage.getItem(LAST_EVENT_ID_KEY);
            // Return the stored ID or '0' if not found (new machine/browser)
            return lastEventId || '0';
        }
        // localStorage not available (e.g., private browsing)
        return '0';
    } catch (error) {
        console.error('Error accessing localStorage:', error);
        return '0';
    }
};

const setLastEventId = (eventId: string): void => {
    try {
        // Only write to localStorage if it's available
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LAST_EVENT_ID_KEY, eventId);
        }
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
};

const createSSEConnectionManager = (): SSEConnectionManager => {
    // Use regular object references instead of React hooks
    const eventSourceRef = { current: null as EventSource | null };
    const messageHandlersRef = { current: new Set<(message: any) => void>() };
    const { updateTestCaseStatus } = useTestCaseStatusStore.getState();

    const handleMessage = (message: any) => {
        console.log('Received SSE message:', message);

        // Update the last processed event ID
        if (message.id) {
            setLastEventId(message.id);
        }

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

            // Get the last event ID from localStorage
            const lastEventId = getLastEventId();
            console.log(`Resuming from event ID: ${lastEventId}`);

            eventSourceRef.current = watchUserEvents(
                userId,
                handleMessage,
                handleError,
                lastEventId // Pass the last event ID to resume from
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
