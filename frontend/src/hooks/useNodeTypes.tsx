// useNodeTypes.ts
import { useEffect } from 'react';
import { NodeFactory } from '@/parsers/NodeFactory';
import { useNodeRegistry, type NodeSpec } from '@/features/nodes';

/**
 * Hook to register all available node types as React components.
 *
 * @param setNodeTypes - Callback to store the registered node components.
 * @param updateNodeData - Callback for updating a node's input data.
 * @param updateNodeParameter - Callback for updating a node's parameter.
 */
export const useNodeTypes = (
  setNodeTypes: (types: Record<string, React.FC<any>>) => void,
  updateNodeData: (nodeId: string, newData: any) => void,
  updateNodeParameter: (
    nodeId: string,
    parameterName: string,
    value: any
  ) => void
) => {
  const { getAllNodes, loaded } = useNodeRegistry();

  useEffect(() => {
    // Wait until the node registry is fully loaded
    if (!loaded) return;

    // Fetch all node specifications from the registry
    const allNodeSpecs = getAllNodes();

    console.log("All node specs:", allNodeSpecs);

    // Create an object to hold the generated React components for each node
    const nodeTypeMap: Record<string, React.FC<any>> = {};

    allNodeSpecs.forEach((nodeSpec: NodeSpec) => {
      // Use the factory to create a component for each node type
      const CustomNodeComponent = NodeFactory.createNodeComponent(
        nodeSpec,
        updateNodeData,
        updateNodeParameter
      );

      // Only add if component was successfully created
      if (CustomNodeComponent) {
        nodeTypeMap[nodeSpec.name] = CustomNodeComponent;
      }
    });

    // Store the complete set of node components
    console.log("Node type map:", nodeTypeMap);
    setNodeTypes(nodeTypeMap);
  }, [loaded, setNodeTypes, updateNodeData, updateNodeParameter]);
};
