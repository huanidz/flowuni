import { useEffect } from 'react';
import nodeRegistry from '@/parsers/NodeRegistry';
import { NodeFactory } from '@/parsers/NodeFactory';

export const useNodeTypes = (setNodeTypes: (types: any) => void) => {
  useEffect(() => {
    const loadNodes = async () => {
      try {
        await nodeRegistry.loadCatalog();
        const allNodes = nodeRegistry.getAllNodes();
        const customNodeTypes: { [key: string]: React.FC<any> } = {};
        
        allNodes.forEach(nodeSpec => {
          const CustomNodeComponent = NodeFactory.createNodeComponent(nodeSpec.name);
          if (CustomNodeComponent) {
            customNodeTypes[nodeSpec.name] = CustomNodeComponent;
          }
        });
        
        setNodeTypes(customNodeTypes);
      } catch (error) {
        console.error("Failed to load node catalog or create node components:", error);
      }
    };

    loadNodes();
  }, [setNodeTypes]);
};