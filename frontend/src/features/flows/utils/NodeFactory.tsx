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

      // Direct handlers passed from the unified update system
      const handleParameterChange = updateNodeParameter
        ? (paramName: string, value: any) => updateNodeParameter(id, paramName, value)
        : undefined;
        
      const handleInputValueChange = updateNodeData
        ? (inputName: string, value: any) => updateNodeData(id, {
            input_values: {
              ...input_values,
              [inputName]: value
            },
          })
        : undefined;
        
      const handleModeChange = updateNodeModeData
        ? (newMode: string) => updateNodeModeData(id, newMode)
        : undefined;


      // === Render Node UI ===
      return (
        <div style={nodeStyles.container}>
          <NodeHeader
            label={label}
            description={description}
            mode={mode}
            onModeChange={handleModeChange || (() => {})}
            canBeTool={can_be_tool}
          />

          {/* Inputs Configuration */}
          <InputsSection
            spec_inputs={nodeSpec.inputs}
            input_values={input_values}
            nodeId={id}
            onInputValueChange={handleInputValueChange || (() => {})}
            node_mode={mode}
          />

          {/* Outputs Display */}
          <OutputsSection spec_outputs={nodeSpec.outputs} node_mode={mode} />

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