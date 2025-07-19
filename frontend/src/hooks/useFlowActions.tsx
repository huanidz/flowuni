import React, { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import axios from 'axios';

const getFlowGraphData = (nodes: Node[], edges: Edge[]) => ({
  nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
  edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
    id, source, target, sourceHandle, targetHandle,
  })),
});

const logNodeDetails = (nodes: Node[]) => {
  nodes.forEach((node, index) => {
    console.log(`Node ${index} (${node.id}):`, {
      type: node.type,
      parameters: node.data.parameters,
      input_values: node.data.input_values,
      fullData: node.data,
    });
  });
};

const handleFlowRequest = async (
  nodes: Node[],
  edges: Edge[],
  endpoint: string,
  actionLabel: string
) => {
  console.log(`=== ${actionLabel} START ===`);
  console.log('Raw nodes:', nodes);
  console.log('Raw edges:', edges);

  const flowGraphData = getFlowGraphData(nodes, edges);
  console.log('Compiling flow with payload:', flowGraphData);

//   logNodeDetails(nodes);

  try {
    const response = await axios.post(endpoint, flowGraphData);
    console.log(`${actionLabel} successful:`, response.data);
  } catch (error) {
    console.error(`Error during ${actionLabel.toLowerCase()}:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Server responded with:', error.response?.data);
    }
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
  selectedEdgeIds: string[]
) => {

  const onCompileFlow = useCallback(() => {
    return handleFlowRequest(
      nodes,
      edges,
      'http://localhost:5002/api/flow_execution/compile',
      'COMPILATION'
    );
  }, [nodes, edges]);

  const onRunFlow = useCallback(() => {
    return handleFlowRequest(
      nodes,
      edges,
      'http://localhost:5002/api/flow_execution/execute',
      'COMPILATION & RUN FLOW'
    );
  }, [nodes, edges]);

  const onClearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
  }, [setNodes, setEdges, setNodeId]);

  const onDeleteSelectedElements = useCallback(() => {
    setNodes(nodes.filter((node) => !selectedNodeIds.includes(node.id)));
    setEdges(edges.filter((edge) => !selectedEdgeIds.includes(edge.id)));
    }, [nodes, edges, selectedNodeIds, selectedEdgeIds, setNodes, setEdges]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Delete':
        onDeleteSelectedElements();
        break;
      default:
        break;
    }
  }, [onDeleteSelectedElements]);

  return { onCompileFlow, onRunFlow, onClearFlow, onDeleteSelectedElements, onKeyDown };
};
