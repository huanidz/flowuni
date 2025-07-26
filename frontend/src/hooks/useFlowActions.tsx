import React, { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores';
import { getFlowGraphData, logNodeDetails } from '@/features/flows/utils';
import { saveFlow, compileFlow, runFlow } from '@/features/flows/api';
import { toast } from 'sonner';

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
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  setNodeId: (id: number) => void,
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
) => {
  const { current_flow } = useFlowStore();

  const onCompileFlow = useCallback(() => {
    return handleFlowRequest(nodes, edges, compileFlow, 'COMPILATION');
  }, [nodes, edges]);

  const onRunFlow = useCallback(() => {
    return handleFlowRequest(nodes, edges, runFlow, 'COMPILATION & RUN FLOW');
  }, [nodes, edges]);

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
      visibleToasts: 1,
    });
  }, [nodes, edges]);

  const onClearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
  }, [setNodes, setEdges, setNodeId]);

  const onDeleteSelectedElements = useCallback(() => {
    setNodes(nodes.filter(node => !selectedNodeIds.includes(node.id)));
    setEdges(edges.filter(edge => !selectedEdgeIds.includes(edge.id)));
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
