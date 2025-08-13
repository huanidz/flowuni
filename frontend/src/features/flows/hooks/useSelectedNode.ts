import { useCallback } from 'react';
import { useNodes, type Node } from '@xyflow/react';
import useFlowStore from '@/features/flows/stores/flow_stores';
import { useNodeRegistry } from '@/features/nodes';
import type { NodeData } from '@/features/nodes/types';

/**
 * Hook for managing the selected node state and providing node data
 */
export const useSelectedNode = () => {
  const nodes = useNodes<Node<NodeData>>();
  const { selectedNodeId, setSelectedNodeId, isSidebarCollapsed, setSidebarCollapsed } = useFlowStore();
  const { getNodeSpecByRFNodeType } = useNodeRegistry();

  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;
  const nodeSpec = selectedNode ? getNodeSpecByRFNodeType(selectedNode.data.node_type as string) : null;

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    // Expand sidebar when a node is selected
    if (nodeId && isSidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  }, [setSelectedNodeId, isSidebarCollapsed, setSidebarCollapsed]);

  const deselectNode = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed, setSidebarCollapsed]);

  const closeSidebar = useCallback(() => {
    setSelectedNodeId(null);
    setSidebarCollapsed(true);
  }, [setSelectedNodeId, setSidebarCollapsed]);

  return {
    selectedNode,
    nodeSpec,
    selectedNodeId,
    isSidebarCollapsed,
    selectNode,
    deselectNode,
    toggleSidebarCollapse,
    closeSidebar,
  };
};