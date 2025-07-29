import React, { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores';
import { getFlowGraphData, logNodeDetails } from '@/features/flows/utils';
import { saveFlow, compileFlow, runFlow } from '@/features/flows/api';
import { watchFlowExecution } from '@/api/sse';
import { toast } from 'sonner';

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
    console.warn(`Cannot ${actionLabel.toLowerCase()}: No nodes in the graph`);
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
  setNodeId: (id: number) => void,
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
) => {
  const { current_flow } = useFlowStore();

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
      console.log('[onRunFlow] Watching execution with task_id:', task_id);

      const eventSource = watchFlowExecution(task_id, (msg) => {
        console.log('[SSE] Raw message received:', msg);

        let parsed;
        /*
        parsed = {
          "node_id": "nodeId_One-in-One-out Node_3",
          "event": "success",
          "data": {
              "label": "One-in-One-out Node",
              "node_type": "One-in-One-out Node",
              "input_values": {
                  "0": {
                      "name": "message_in",
                      "type": "TextFieldInputHandle",
                      "value": null,
                      "default": null,
                      "required": false,
                      "description": "The message to be sent."
                  },
                  "message_in": "zxc"
              },
              "output_values": {
                  "message_out": "zxc"
              },
              "parameters": {}
          },
          "timestamp": "2025-07-29T07:04:43.285104"
        }
        */
        try {
          parsed = JSON.parse(msg);
          console.log("[SSE] Parsed message:", parsed);
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
        const { input_values } = data;
        console.log('[SSE] Updating node:', node_id, 'with input_values:', input_values);

        setNodes((prevNodes: Node[]) =>
          prevNodes.map((node) =>
            node.id === node_id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    execution_result: JSON.stringify(parsed, null, 2),
                    execution_status: event_status,
                  },
                }
              : node
          )
        );
      });

    } catch (err) {
      console.error('[onRunFlow] Flow run failed:', err);
    }
  }, [nodes, edges, current_flow, setNodes]);

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
    setNodeId(1);
  }, [setNodes, setEdges, setNodeId]);

  const onDeleteSelectedElements = useCallback(() => {
    // Filter out selected nodes
    const remainingNodes = nodes.filter(node => !selectedNodeIds.includes(node.id));
    
    // Filter out edges that are either:
    // 1. Explicitly selected (selectedEdgeIds)
    // 2. Connected to any deleted node (source or target is in selectedNodeIds)
    const remainingEdges = edges.filter(edge => 
      !selectedEdgeIds.includes(edge.id) && 
      !selectedNodeIds.includes(edge.source) && 
      !selectedNodeIds.includes(edge.target)
    );
    
    setNodes(remainingNodes);
    setEdges(remainingEdges);
  }, [nodes, edges, selectedNodeIds, selectedEdgeIds, setNodes, setEdges]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Delete':
          onDeleteSelectedElements();
          break;
        default:
          break;
      }
    },
    [onDeleteSelectedElements]
  );

  return {
    onCompileFlow,
    onRunFlow,
    onClearFlow,
    onDeleteSelectedElements,
    onKeyDown,
    onSaveFlow,
  };
};
