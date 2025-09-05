import React, { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { getFlowGraphData, logNodeDetails } from '@/features/flows/utils';
import { saveFlow, compileFlow, runFlow } from '@/features/flows/api';
import { watchFlowExecution } from '@/api/sse';
import { toast } from 'sonner';
import { useSelectedNode } from '@/features/flows/hooks/useSelectedNode';

type SetNodesType = React.Dispatch<React.SetStateAction<Node[]>>;
type SetEdgesType = React.Dispatch<React.SetStateAction<Edge[]>>;

const handleFlowRequest = async (
    nodes: Node[],
    edges: Edge[],
    requestFn: (nodes: Node[], edges: Edge[]) => Promise<any>,
    actionLabel: string
) => {
    console.log(`=== ${actionLabel} START ===`);
    console.log('Raw nodes:', nodes);
    console.log('Raw edges:', edges);

    if (nodes.length === 0) {
        console.warn(
            `Cannot ${actionLabel.toLowerCase()}: No nodes in the graph`
        );
        return;
    }

    const flowGraphData = getFlowGraphData(nodes, edges);
    console.log('Compiling flow with payload:', flowGraphData);
    logNodeDetails(nodes);

    try {
        const response = await requestFn(nodes, edges);
        console.log(`${actionLabel} successful:`, response);
    } catch (error) {
        console.error(`Error during ${actionLabel.toLowerCase()}:`, error);
    }

    console.log(`=== ${actionLabel} END ===`);
};

export const useFlowActions = (
    nodes: Node[],
    edges: Edge[],
    setNodes: SetNodesType,
    setEdges: SetEdgesType,
    nodeUpdateHandlers: any
) => {
    const { current_flow } = useFlowStore();
    const { selectedNode } = useSelectedNode();

    const { updateNodeExecutionResult, updateNodeExecutionStatus } =
        nodeUpdateHandlers;

    const onCompileFlow = useCallback(() => {
        return handleFlowRequest(nodes, edges, compileFlow, 'COMPILATION');
    }, [nodes, edges]);

    const onRunFlow = useCallback(async () => {
        if (!current_flow) {
            console.warn('Cannot run flow: No current flow');
            return;
        }

        console.log('[onRunFlow] Running flow...');

        try {
            const response = await runFlow(nodes, edges);
            const { task_id } = response;

            console.log('[onRunFlow] Flow run response:', response);
            console.log(
                '[onRunFlow] Watching execution with task_id:',
                task_id
            );

            const eventSource = watchFlowExecution(task_id, msg => {
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
                    console.warn(
                        '[SSE] No data field in parsed message:',
                        parsed
                    );
                    return;
                }

                const node_id = parsed?.node_id;
                const event_status = parsed?.event;
                const { input_values } = data;
                console.log(
                    '[SSE] Updating node:',
                    node_id,
                    'with input_values:',
                    input_values
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
            });
        } catch (err) {
            console.error('[onRunFlow] Flow run failed:', err);
        }
    }, [nodes, edges, current_flow, nodeUpdateHandlers]);

    const onRunFlowFromSelectedNode = useCallback(async () => {
        if (!current_flow) {
            console.warn('Cannot run flow: No current flow');
            return;
        }

        if (!selectedNode) {
            toast.warning('No node selected', {
                description: 'Please select a node to run the flow from.',
            });
            return;
        }

        console.log(
            '[onRunFlowFromSelectedNode] Running flow from selected node...',
            selectedNode.id
        );

        try {
            // Use the modified runFlow function with start_node and scope parameters
            const response = await runFlow(
                nodes,
                edges,
                selectedNode.id,
                'downstream'
            );
            const { task_id } = response;

            console.log(
                '[onRunFlowFromSelectedNode] Flow run response:',
                response
            );
            console.log(
                '[onRunFlowFromSelectedNode] Watching execution with task_id:',
                task_id
            );

            const eventSource = watchFlowExecution(task_id, msg => {
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
                    console.warn(
                        '[SSE] No data field in parsed message:',
                        parsed
                    );
                    return;
                }

                const node_id = parsed?.node_id;
                const event_status = parsed?.event;
                const { input_values } = data;
                console.log(
                    '[SSE] Updating node:',
                    node_id,
                    'with input_values:',
                    input_values
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
            });
        } catch (err) {
            console.error('[onRunFlowFromSelectedNode] Flow run failed:', err);
            toast.error('Failed to run flow from selected node', {
                description:
                    err instanceof Error
                        ? err.message
                        : 'Unknown error occurred',
            });
        }
    }, [nodes, edges, current_flow, selectedNode, nodeUpdateHandlers]);

    const onSaveFlow = useCallback(async () => {
        if (!current_flow) {
            console.warn('Cannot save flow: No current flow');
            return;
        }

        await saveFlow({
            flow_id: current_flow.flow_id,
            name: current_flow.name,
            description: current_flow.description,
            is_active: current_flow.is_active,
            flow_definition: getFlowGraphData(nodes, edges),
        });

        toast.success('Flow saved successfully.', {
            description: 'Flow has been saved successfully.',
        });
    }, [nodes, edges]);

    const onClearFlow = useCallback(() => {
        setNodes([]);
        setEdges([]);
        // Node ID reset is no longer needed as we're using timestamp-based IDs
    }, [setNodes, setEdges]);

    const onPlaygroundFlow = useCallback(() => {
        // Dummy function for playground action
        console.log('Playground action triggered');
    }, []);

    return {
        onCompileFlow,
        onRunFlow,
        onRunFlowFromSelectedNode,
        onClearFlow,
        onSaveFlow,
        onPlaygroundFlow,
    };
};
