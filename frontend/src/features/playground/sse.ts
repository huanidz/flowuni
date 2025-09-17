import { watchFlowExecution } from '@/api/sse';
import { NODE_EXECUTION_STATE } from '@/features/flows/consts';
import {
    CHAT_OUTPUT_NODE_TYPE,
    SSE_LOG_PREFIX,
    ROLE_ASSISTANT,
} from '@/features/flows/components/Canvas/PlaygroundComponents/constants';

// Types for SSE handling
export interface SSEMessageData {
    event: string;
    data: any;
}

export interface SSEHandlers {
    onFlowFailed?: (error: string) => void;
    onFlowCompleted?: (nodeType: string, inputValues: any) => void;
    onNodeCompleted?: (nodeType: string) => void;
    onMessageParsed?: (parsed: SSEMessageData) => void;
}

export interface FlowExecutionOptions {
    taskId: string;
    onFlowRunningChange: (isRunning: boolean) => void;
    onFlowErrorChange: (error: string | null) => void;
    cleanupEventSource: () => void;
    cleanupTimeout: () => void;
    flowExecutionTimeout: number;
    handlers?: SSEHandlers;
}

/**
 * Parse SSE message and return structured data
 */
export const parseSSEMessage = (message: string): SSEMessageData | null => {
    try {
        const parsed = JSON.parse(message);
        console.log(`${SSE_LOG_PREFIX} Parsed message:`, parsed);
        return parsed;
    } catch (error) {
        console.error(
            `${SSE_LOG_PREFIX} Failed to parse message:`,
            error,
            'Raw message:',
            message
        );
        return null;
    }
};

/**
 * Handle SSE data with customizable handlers
 */
export const handleSSEData = (
    parsed: SSEMessageData | null,
    handlers: SSEHandlers = {}
) => {
    if (!parsed) {
        console.warn(`${SSE_LOG_PREFIX} No parsed message`);
        return;
    }

    const { event, data } = parsed;

    // Call the general message parsed handler if provided
    handlers.onMessageParsed?.(parsed);

    // Handle failed events
    if (event === 'failed' && data?.error) {
        console.error(`${SSE_LOG_PREFIX} Flow execution failed:`, data.error);
        handlers.onFlowFailed?.(data.error);
        return;
    }

    // Handle successful events
    if (event === NODE_EXECUTION_STATE.COMPLETED && data) {
        const { node_type, input_values } = data;

        // Call the general node completed handler
        handlers.onNodeCompleted?.(node_type);

        // Special handling for chat output node
        if (node_type === CHAT_OUTPUT_NODE_TYPE && input_values?.message_in) {
            handlers.onFlowCompleted?.(node_type, input_values);
        }

        console.log(`${SSE_LOG_PREFIX} Processed node:`, node_type);
    }
};

/**
 * Execute flow with SSE monitoring
 */
export const executeFlowWithSSE = ({
    taskId,
    onFlowRunningChange,
    onFlowErrorChange,
    cleanupEventSource,
    cleanupTimeout,
    flowExecutionTimeout,
    handlers = {},
}: FlowExecutionOptions) => {
    let eventSource: EventSource | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Watch flow execution via SSE
    eventSource = watchFlowExecution(taskId, (message: string) => {
        const parsed = parseSSEMessage(message);
        if (parsed) {
            handleSSEData(parsed, {
                ...handlers,
                onFlowFailed: (error: string) => {
                    cleanupTimeout();
                    onFlowRunningChange(false);
                    onFlowErrorChange(error);
                    cleanupEventSource();
                    handlers.onFlowFailed?.(error);
                },
                onFlowCompleted: (nodeType: string, inputValues: any) => {
                    cleanupTimeout();
                    onFlowRunningChange(false);
                    cleanupEventSource();
                    handlers.onFlowCompleted?.(nodeType, inputValues);
                },
            });
        }
    });

    // Set a timeout to handle cases where we don't get a response
    timeoutId = setTimeout(() => {
        console.warn(`${SSE_LOG_PREFIX} Timeout waiting for response`);
        onFlowErrorChange('Flow execution timed out');
        onFlowRunningChange(false);
        cleanupEventSource();
    }, flowExecutionTimeout);

    // Handle SSE connection errors
    if (eventSource) {
        eventSource.onerror = error => {
            console.error(`${SSE_LOG_PREFIX} Connection error:`, error);
            onFlowErrorChange('Connection to flow execution failed');
            onFlowRunningChange(false);
            cleanupTimeout();
            cleanupEventSource();
        };

        // Store the original close method to log when it's called
        const originalClose = eventSource.close;
        eventSource.close = function () {
            console.log(`${SSE_LOG_PREFIX} Connection closed`);
            // Don't automatically set running to false here
            // Let the timeout or successful response handle it
            return originalClose.call(this);
        };
    }

    return {
        eventSource,
        timeoutId,
    };
};
