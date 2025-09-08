import { watchFlowExecution } from '@/api/sse';
import { toast } from 'sonner';
import type { Node } from '@xyflow/react';

/**
 * Creates and returns a function that handles SSE events for flow execution
 * @param nodeUpdateHandlers - Handlers for updating node execution data
 * @returns A function that takes a task_id and sets up SSE event listening
 */
export const createSSEEventHandler = (nodeUpdateHandlers: any) => {
    const {
        updateNodeExecutionResult,
        updateNodeExecutionStatus,
        updateNodeOutputData,
    } = nodeUpdateHandlers;

    return (task_id: string) => {
        console.log('[SSE] Setting up event listener for task_id:', task_id);

        return watchFlowExecution(task_id, msg => {
            console.log('[SSE] Raw message received:', msg);

            let parsed;

            try {
                parsed = JSON.parse(msg);
                console.log('[SSE] Parsed message:', parsed);
            } catch (e) {
                console.error('[SSE] Failed to parse message:', e);
                return;
            }

            const data = parsed?.data;
            if (!data) {
                console.warn('[SSE] No data field in parsed message:', parsed);
                return;
            }

            const node_id = parsed?.node_id;
            const event_status = parsed?.event;
            const { input_values, output_values } = data;
            console.log(
                '[SSE] Updating node:',
                node_id,
                'with input_values:',
                input_values
            );
            console.log(
                '[SSE] Updating node:',
                node_id,
                'with output_values:',
                output_values
            );

            // Update node execution data using the provided handlers
            if (updateNodeExecutionResult) {
                updateNodeExecutionResult(
                    node_id,
                    JSON.stringify(parsed, null, 2)
                );
            }
            if (updateNodeExecutionStatus) {
                updateNodeExecutionStatus(node_id, event_status);
            }
            if (updateNodeOutputData && output_values) {
                // Update each output value individually
                Object.entries(output_values).forEach(([outputName, value]) => {
                    updateNodeOutputData(node_id, outputName, value);
                });
            }
        });
    };
};

/**
 * Validates if the current flow and selected node are available
 * @param current_flow - The current flow object
 * @param selectedNode - The selected node object
 * @param showToast - Function to show toast notifications
 * @param allowNoSelection - Whether to allow no selected node (default: false)
 * @returns An object with validation result and error message
 */
export const validateFlowExecution = (
    current_flow: any,
    selectedNode: any,
    allowNoSelection: boolean = false
) => {
    if (!current_flow) {
        console.warn('Cannot run flow: No current flow');
        return { isValid: false, error: 'Cannot run flow: No current flow' };
    }

    if (!allowNoSelection && !selectedNode) {
        toast.warning('No node selected', {
            description: 'Please select a node to run the flow from.',
        });
        return { isValid: false, error: 'No node selected' };
    }

    return { isValid: true };
};

/**
 * Handles flow execution errors consistently
 * @param error - The error object
 * @param context - Context information (e.g., function name)
 * @param showToast - Function to show toast notifications
 */
export const handleFlowExecutionError = (error: any, context: string) => {
    console.error(`[${context}] Flow execution failed:`, error);

    const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

    const toastMessage = context
        .replace('on', '')
        .replace(/([A-Z])/g, ' $1')
        .trim();

    toast.error(`Failed to ${toastMessage.toLowerCase()}`, {
        description: errorMessage,
    });
};
