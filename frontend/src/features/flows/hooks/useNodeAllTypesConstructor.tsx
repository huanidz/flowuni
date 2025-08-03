// useAllNodeTypesConstructor.ts
import { useEffect, useCallback, useState, useMemo } from 'react';
import { NodeFactory } from '@/features/flows/utils/NodeFactory';
import { useNodeRegistry, type NodeSpec } from '@/features/nodes';
import type { Node } from '@xyflow/react';

type SetNodesType = React.Dispatch<React.SetStateAction<Node[]>>;

/**
 * Hook to register all available node types as React components.
 * Simplified to return nodeTypes directly and manage state internally.
 *
 * @param setNodes - Callback to update nodes state from useNodesState.
 * @returns Object containing nodeTypes and loading state.
 */
export const useAllNodeTypesConstructor = (setNodes: SetNodesType) => {
  const { getAllNodes, loaded } = useNodeRegistry();
  const [nodeTypes, setNodeTypes] = useState<Record<string, React.FC<any>>>({});
  const [nodeTypesLoaded, setNodeTypesLoaded] = useState(false);

  const updateNodeInputDataHandler = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          
          // Handle input_values as dictionary (no conversion needed)
          const inputValues = newData.input_values;

          // Node has schema of: RFNode (ReactFlow Node with data = NodeData)
          // Reference: samples/RFNode_InputUpdateHandler.json

          return {
            ...node, // Spread other fields.
            data: { // Update 'data' field.
              ...node.data,
              input_values: inputValues,
            },
          };
        })
      );
    },
    [setNodes]
  );

  // Enhanced node parameter update function
  // Not doing anything now.
  const updateNodeParameterDataHandler = useCallback(
    () => {},
    []
  );

  useEffect(() => {
    // Wait until the node registry is fully loaded
    if (!loaded) {
      setNodeTypesLoaded(false);
      return;
    }

    // Fetch all node specifications from the registry
    const allNodeSpecs = getAllNodes();

    console.log("All node specs:", allNodeSpecs);

    // Create an object to hold the generated React components for each node
    const nodeTypeMap: Record<string, React.FC<any>> = {};

    allNodeSpecs.forEach((nodeSpec: NodeSpec) => {
      console.log("Node spec:", nodeSpec);

      // Use the factory to create a component for each node type
      const CustomNodeComponent = NodeFactory.createNodeComponent(
        nodeSpec,
        updateNodeInputDataHandler,
        updateNodeParameterDataHandler
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
    
  }, [loaded, updateNodeInputDataHandler, updateNodeParameterDataHandler, getAllNodes]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    nodeTypes,
    nodeTypesLoaded,
    loaded
  }), [nodeTypes, nodeTypesLoaded, loaded]);
};