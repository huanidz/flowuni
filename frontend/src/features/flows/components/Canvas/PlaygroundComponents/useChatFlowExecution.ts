import { useState, useCallback, useRef, useEffect } from 'react';
import { useNodes, useEdges } from '@xyflow/react';
import { runFlow } from '../../../api';
import { watchFlowExecution } from '@/api/sse';
import { NODE_EXECUTION_STATE } from '../../../consts';

interface UseChatFlowExecutionReturn {
    isFlowRunning: boolean;
    flowError: string | null;
    executeFlow: () => Promise<void>;
    onMessageReceived?: (message: PGMessage) => void;
}

type PGMessage = {
    id: string;
    user_id: number;
    message: string;
    timestamp: Date;
};

export const useChatFlowExecution = ({
    onMessageReceived,
}: {
    onMessageReceived?: (message: PGMessage) => void;
} = {}): UseChatFlowExecutionReturn => {
    const nodes = useNodes();
    const edges = useEdges();
    const [isFlowRunning, setIsFlowRunning] = useState(false);
    const [flowError, setFlowError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup event source on unmount or close
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (flowTimeoutRef.current) {
                clearTimeout(flowTimeoutRef.current);
                flowTimeoutRef.current = null;
            }
        };
    }, []);

    // Parse SSE message safely
    const parseSSEMessage = useCallback((message: string) => {
        try {
            const parsed = JSON.parse(message);
            console.log('[SSE] Parsed message:', parsed);
            return parsed;
        } catch (error) {
            console.error(
                '[SSE] Failed to parse message:',
                error,
                'Raw message:',
                message
            );
            return null;
        }
    }, []);

    // Handle SSE message data
    const handleSSEData = useCallback((parsed: any) => {
        if (!parsed) {
            console.warn('[SSE] No parsed message');
            return;
        }

        const { event, data } = parsed;

        // Handle failed events
        if (event === 'failed' && data?.error) {
            console.error('[SSE] Flow execution failed:', data.error);

            // Clear timeout since we got a response (even if failed)
            if (flowTimeoutRef.current) {
                clearTimeout(flowTimeoutRef.current);
                flowTimeoutRef.current = null;
            }

            setIsFlowRunning(false);
            setFlowError(data.error);

            // Close the event source since the flow failed
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            return;
        }

        // Handle successful events
        if (event === NODE_EXECUTION_STATE.COMPLETED && data) {
            const { node_type, input_values } = data;

            if (node_type === 'Chat Output' && input_values?.message_in) {
                // Clear timeout since we got a response
                if (flowTimeoutRef.current) {
                    clearTimeout(flowTimeoutRef.current);
                    flowTimeoutRef.current = null;
                }

                const newMessage: PGMessage = {
                    id: `bot-${Date.now()}`,
                    user_id: 0, // Bot message
                    message: input_values.message_in,
                    timestamp: new Date(),
                };

                // Notify parent component of new message
                if (onMessageReceived) {
                    onMessageReceived(newMessage);
                }

                setIsFlowRunning(false);

                // Close the event source since we got our response
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                }
            }

            // Handle other node types if needed
            console.log('[SSE] Processed node:', node_type);
        }
    }, []);

    // Run flow and handle execution
    const executeFlow = useCallback(async () => {
        if (isFlowRunning) {
            console.warn('Flow is already running');
            return;
        }

        setIsFlowRunning(true);
        setFlowError(null);

        try {
            // Close any existing event source
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const response = await runFlow(nodes, edges);
            console.log('[Flow] Run response:', response);

            const { task_id } = response;
            if (!task_id) {
                throw new Error('No task_id received from flow execution');
            }

            // Watch flow execution via SSE
            eventSourceRef.current = watchFlowExecution(task_id, message => {
                const parsed = parseSSEMessage(message);
                if (parsed) {
                    handleSSEData(parsed);
                }
            });

            // Set a timeout to handle cases where we don't get a response
            flowTimeoutRef.current = setTimeout(() => {
                console.warn('[Flow] Timeout waiting for response');
                setFlowError('Flow execution timed out');
                setIsFlowRunning(false);

                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                }
            }, 30000); // 30 second timeout

            // Handle SSE connection errors
            if (eventSourceRef.current) {
                eventSourceRef.current.onerror = error => {
                    console.error('[SSE] Connection error:', error);
                    setFlowError('Connection to flow execution failed');
                    setIsFlowRunning(false);

                    if (flowTimeoutRef.current) {
                        clearTimeout(flowTimeoutRef.current);
                        flowTimeoutRef.current = null;
                    }

                    if (eventSourceRef.current) {
                        eventSourceRef.current.close();
                        eventSourceRef.current = null;
                    }
                };

                eventSourceRef.current.close = () => {
                    console.log('[SSE] Connection closed');
                    // Don't automatically set running to false here
                    // Let the timeout or successful response handle it
                };
            }
        } catch (error) {
            console.error('[Flow] Error running flow:', error);
            setFlowError(
                error instanceof Error ? error.message : 'Failed to run flow'
            );
            setIsFlowRunning(false);
        }
    }, [nodes, edges, isFlowRunning, parseSSEMessage, handleSSEData]);

    return {
        isFlowRunning,
        flowError,
        executeFlow,
    };
};

export default useChatFlowExecution;
