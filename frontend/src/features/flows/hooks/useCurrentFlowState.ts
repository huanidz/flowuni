import { useCallback, useMemo } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { parseFlowDefinition } from '@/features/flows/utils';
import { useNodeRegistry } from '@/features/nodes';
import { useGetFlowDetail } from '@/features/flows/hooks';

/**
 * Custom hook for managing flow state in the FlowBuilder component
 * 
 * This hook consolidates the state management logic that was previously
 * spread across multiple hooks and the component itself. It handles:
 * - Flow data loading and parsing
 * - Node and edge state management
 * - Flow initialization and reinitialization
 * - Loading and error states
 */
export const useCurrentFlowState = (flow_id: string) => {
  const { current_flow } = useFlowStore();
  const { loaded: nodeRegistryLoaded } = useNodeRegistry();
  
  // Initialize node and edge state using XYFlow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Parse flow definition when data is available
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!current_flow?.flow_definition || !nodeRegistryLoaded) {
      return { initialNodes: [], initialEdges: [] };
    }

    const parsed = parseFlowDefinition(current_flow.flow_definition);
    
    return {
      initialNodes: parsed.nodes,
      initialEdges: parsed.edges,
    };
  }, [current_flow?.flow_definition, nodeRegistryLoaded]);

  // Initialize flow with parsed data
  const initializeFlow = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Reinitialize flow with new nodes and edges
  const reinitializeFlow = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Get loading and error states
  const { isLoading: isLoadingFlow, error: flowError } = useGetFlowDetail({
    flowId: flow_id,
    enabled: !!flow_id
  });
  const isLoading = isLoadingFlow || !nodeRegistryLoaded;

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    initialNodes,
    initialEdges,
    initializeFlow,
    reinitializeFlow,
    isLoading,
    flowError,
    nodeRegistryLoaded
  };
};