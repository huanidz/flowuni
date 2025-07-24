import { useEffect } from 'react';
import { NodeFactory } from '@/parsers/NodeFactory';
import { useNodeRegistry } from '@/features/nodes';
import { type NodeSpec } from '@/features/nodes';

export const useNodeTypes = (
  setNodeTypes: (types: any) => void,
  updateNodeData: (nodeId: string, newData: any) => void,
  updateNodeParameter: (
    nodeId: string,
    parameterName: string,
    value: any
  ) => void
) => {

  const { getAllNodes, loaded } = useNodeRegistry();

  useEffect(() => {
    if (!loaded) return;

    const allNodes = getAllNodes();
    const customNodeTypes: { [key: string]: React.FC<any> } = {};

    allNodes.forEach((nodeSpec: NodeSpec) => {
      const CustomNodeComponent = NodeFactory.createNodeComponent(
        nodeSpec,
        updateNodeData,
        updateNodeParameter
      );
      if (CustomNodeComponent) {
        customNodeTypes[nodeSpec.name] = CustomNodeComponent;
      }
    });

    setNodeTypes(customNodeTypes);
  }, [loaded, setNodeTypes, updateNodeData, updateNodeParameter]);
};
