// NodeFactory.tsx

import React from 'react';

// Types
import type {
  NodeSpec,
  CustomNodeProps,
  UpdateNodeDataFunction,
  UpdateNodeParameterFunction,
} from '@/features/nodes';

// UI Sections
import {
  NodeHeader,
  ParametersSection,
  InputsSection,
  OutputsSection,
  NodeExecutionResult
} from './NodeSections';

// Hooks
import { useNodeHandlers } from '@/features/flows/hooks/useNodeHandlers';

// Styles
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

/**
 * Factory class to create custom React components for different node types.
 */
class NodeFactoryClass {
  /**
   * Generates a custom node component based on a given node specification.
   *
   * @param nodeSpec - The specification of the node to render.
   * @param updateNodeData - Optional callback to update node data.
   * @param updateNodeParameter - Optional callback to update node parameters.
   * @returns A React functional component for the node, or null if spec is invalid.
   */
  createNodeComponent(
    nodeSpec: NodeSpec,
    updateNodeData?: UpdateNodeDataFunction,
    updateNodeParameter?: UpdateNodeParameterFunction
  ): React.FC<CustomNodeProps> | null {

    if (!nodeSpec) {
      console.error(`Node type "${nodeSpec}" not found in registry`);
      return null;
    }

    /**
     * A React component that renders a node UI based on the provided props and spec.
     */
    const CustomNode: React.FC<CustomNodeProps> = ({ data, id }) => {
      const {
        label = nodeSpec.name,
        description = nodeSpec.description,
        parameter_values = [],
        input_values = [],
        output_values = [],
      } = data;
      console.log("Node data:", data);

      // Hook to manage user interactions with parameters and inputs
      const {
        handleParameterChange,
        handleInputValueChange
      } = useNodeHandlers(
        id,
        input_values,
        updateNodeData,
        updateNodeParameter
      );

      return (
        <div style={nodeStyles.container}>
          {/* Node Title and Description */}
          <NodeHeader label={label} description={description} />

          {/* Parameters Configuration */}
          <ParametersSection
            spec_parameters={Object.values(nodeSpec.parameters)}
            parameter_values={parameter_values}
            nodeId={id}
            onParameterChange={handleParameterChange}
          />

          {/* Inputs Configuration */}
          <InputsSection
            spec_inputs={nodeSpec.inputs}
            input_values={input_values}
            nodeId={id}
            onInputValueChange={handleInputValueChange}
          />

          {/* Outputs Display */}
          <OutputsSection spec_outputs={nodeSpec.outputs} />

          {/* Node Execution Result */}
          <NodeExecutionResult
            result={data.execution_result}
            status={data.execution_status}
          />
        </div>
      );
    };

    // Set a helpful display name for debugging in React DevTools
    CustomNode.displayName = `${nodeSpec.name.replace(/\s+/g, '')}Node`;

    return CustomNode;
  }
}

// Export a single shared instance of the factory
export const NodeFactory = new NodeFactoryClass();
