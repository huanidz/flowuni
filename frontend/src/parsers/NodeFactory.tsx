// RefactoredNodeFactory.tsx
import React from "react";
import nodeRegistry from "./NodeRegistry";
import type { 
  NodeSpec, 
  CustomNodeProps, 
  UpdateNodeDataFunction, 
  UpdateNodeParameterFunction 
} from "./NodeTypes";
import { NodeHeader, ParametersSection, InputsSection, OutputsSection } from "./NodeSections";
import { useNodeHandlers } from "@/hooks/useNodeHandlers";
import { nodeStyles } from "@/styles/nodeStyles";

class NodeFactoryClass {
  createNodeComponent(
    nodeType: string,
    updateNodeData?: UpdateNodeDataFunction,
    updateNodeParameter?: UpdateNodeParameterFunction
  ): React.FC<CustomNodeProps> | null {
    const nodeSpec = nodeRegistry.getNode(nodeType) as NodeSpec | undefined;

    if (!nodeSpec) {
      console.error(`Node type "${nodeType}" not found in registry`);
      return null;
    }

    const CustomNode: React.FC<CustomNodeProps> = ({ data, id }) => {
      const { 
        label = nodeSpec.name, 
        description = nodeSpec.description, 
        parameters = {},
        inputValues = {}
      } = data;

      const { handleParameterChange, handleInputValueChange } = useNodeHandlers(
        id,
        inputValues,
        updateNodeData,
        updateNodeParameter
      );

      return (
        <div style={nodeStyles.container}>
          <NodeHeader label={label} description={description} />
          
          {/* <ParametersSection
            parameters={nodeSpec.parameters}
            parameterValues={parameters}
            nodeId={id}
            onParameterChange={handleParameterChange}
          /> */}
          
          <InputsSection
            inputs={nodeSpec.inputs}
            inputValues={inputValues}
            nodeId={id}
            onInputValueChange={handleInputValueChange}
          />
          
          <OutputsSection outputs={nodeSpec.outputs} />
        </div>
      );
    };

    CustomNode.displayName = `${nodeSpec.name.replace(/\s+/g, '')}Node`;
    return CustomNode;
  }
}

export const NodeFactory = new NodeFactoryClass();