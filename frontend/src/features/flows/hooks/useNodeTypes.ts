// useNodeTypes.ts
import { useEffect, useState, useMemo } from 'react';
import { NodeFactory } from '@/features/flows/utils/NodeFactory';
import { useNodeRegistry, type NodeSpec } from '@/features/nodes';
import type { Node } from '@xyflow/react';

type SetNodesType = React.Dispatch<React.SetStateAction<Node[]>>;

/**
 * Hook to register all available node types as React components.
 * Simplified to return nodeTypes directly and manage state internally.
 * Separates node type registration from state management.
 *
 * @param setNodes - Callback to update nodes state from useNodesState.
 * @param updateNodeData - Function to update node data
 * @param updateNodeModeData - Function to update node mode data
 * @param updateNodeParameterData - Function to update node parameter data
 * @returns Object containing nodeTypes and loading state.
 */
export const useNodeTypes = (
  updateNodeData?: (nodeId: string, newData: any) => void,
  updateNodeModeData?: (nodeId: string, newMode: string) => void,
  updateNodeParameterData?: (nodeId: string, parameterName: string, value: any) => void
) => {
  const { getAllNodeSpecs, loaded } = useNodeRegistry();
  const [nodeTypes, setNodeTypes] = useState<Record<string, React.FC<any>>>({});
  const [nodeTypesLoaded, setNodeTypesLoaded] = useState(false);

  useEffect(() => {
    // Wait until the node registry is fully loaded
    if (!loaded) {
      setNodeTypesLoaded(false);
      return;
    }

    // Fetch all node specifications from the registry
    const allNodeSpecs = getAllNodeSpecs();

    console.log("All node specs:", allNodeSpecs);

    // Create an object to hold the generated React components for each node
    const nodeTypeMap: Record<string, React.FC<any>> = {};

    allNodeSpecs.forEach((nodeSpec: NodeSpec) => {
      console.log("Node spec:", nodeSpec);

      // Use the factory to create a component for each node type
      // Pass the update handlers directly
      const CustomNodeComponent = NodeFactory.createNodeComponent(
        nodeSpec,
        updateNodeData,
        updateNodeModeData,
        updateNodeParameterData
      );

      // Only add if component was successfully created
      if (CustomNodeComponent) {
        nodeTypeMap[nodeSpec.name] = CustomNodeComponent;
      }
    });

    // Store the complete set of node components
    console.log("Node type map:", nodeTypeMap);
    setNodeTypes(nodeTypeMap);
    setNodeTypesLoaded(true);
    
  }, [loaded, getAllNodeSpecs, updateNodeData, updateNodeModeData, updateNodeParameterData]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    nodeTypes,
    nodeTypesLoaded,
    loaded
  }), [nodeTypes, nodeTypesLoaded, loaded]);
};