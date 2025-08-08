// NodeFactory.tsx

import React, { useState } from 'react';

// Types
import type {
  NodeSpec,
  CustomNodeProps,
  UpdateNodeDataFunction,
  UpdateNodeModeDataFunction,
  UpdateNodeParameterFunction,
} from '@/features/nodes';

// Constants
import { NODE_DATA_MODE } from '../consts';

// UI Sections
import { InputsSection } from '../components/NodeSections/InputsSection';
import { OutputsSection } from '../components/NodeSections/OutputsSection';
import { NodeExecutionResult } from '../components/NodeSections/NodeExecutionResult';
import { NodeHeader } from '../components/NodeSections/NodeHeader';
import { ParametersSection } from '../components/NodeSections/ParametersSection';

// Hooks
import { useNodeHandlers } from '@/features/flows/hooks/useNodeHandlers';

// Styles
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

// Type for node modes
type NodeMode = typeof NODE_DATA_MODE.NORMAL | typeof NODE_DATA_MODE.TOOL;

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
    updateNodeModeData?: UpdateNodeModeDataFunction,
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
      
      const label = nodeSpec.name;
      const description = nodeSpec.description;
      const parameter_values = data.parameter_values || {};
      const input_values = data.input_values || {};
      const output_values = data.output_values || {};
      const mode = data.mode || NODE_DATA_MODE.NORMAL;
      const can_be_tool = nodeSpec.can_be_tool;

      // Hook to manage user interactions with parameters and inputs
      const {
        handleParameterChange,
        handleInputValueChange,
        handleModeChange
      } = useNodeHandlers(
        id,
        input_values,
        updateNodeData,
        updateNodeModeData,
        updateNodeParameter
      );

      return (
        <div style={nodeStyles.container}>
          <NodeHeader
            label={label}
            description={description}
            mode={mode}
            onModeChange={handleModeChange}
            canBeTool={can_be_tool}
          />

          {/* Parameters Configuration */}
          {/* <ParametersSection
            spec_parameters={Object.values(nodeSpec.parameters)}
            parameter_values={parameter_values}
            nodeId={id}
            onParameterChange={handleParameterChange}
          /> */}

          {/* Inputs Configuration */}
          <InputsSection
            spec_inputs={nodeSpec.inputs}
            input_values={input_values}
            nodeId={id}
            onInputValueChange={handleInputValueChange}
          />

          {/* Outputs Display */}
          <OutputsSection spec_outputs={nodeSpec.outputs} can_be_tool={nodeSpec.can_be_tool} />

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