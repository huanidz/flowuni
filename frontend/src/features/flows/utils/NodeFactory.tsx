// NodeFactory.tsx

import React from 'react';

// Types
import type {
    NodeSpec,
    CustomNodeProps,
    UpdateNodeInputDataFunction,
    UpdateNodeModeDataFunction,
    UpdateNodeParameterFunction,
    UpdateNodeToolConfigFunction,
    UpdateNodeExecutionResultFunction,
    UpdateNodeExecutionStatusFunction,
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
     * @param updateNodeInputData - Optional callback to update node input data.
     * @param updateNodeParameter - Optional callback to update node parameters.
     * @returns A React functional component for the node, or null if spec is invalid.
     */
    createNodeComponent(
        nodeSpec: NodeSpec,
        updateNodeInputData?: UpdateNodeInputDataFunction,
        updateNodeModeData?: UpdateNodeModeDataFunction,
        updateNodeParameter?: UpdateNodeParameterFunction,
        updateNodeToolConfig?: UpdateNodeToolConfigFunction,
        updateNodeExecutionResult?: UpdateNodeExecutionResultFunction,
        updateNodeExecutionStatus?: UpdateNodeExecutionStatusFunction
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
            const input_values = data.input_values || {};
            const mode = data.mode || NODE_DATA_MODE.NORMAL;
            const can_be_tool = nodeSpec.can_be_tool;

            // Direct handlers passed from the unified update system
            const handleInputValueChange = updateNodeInputData
                ? (inputName: string, value: any) =>
                      updateNodeInputData(id, inputName, value)
                : undefined;

            const handleModeChange = updateNodeModeData
                ? (newMode: string) => updateNodeModeData(id, newMode)
                : undefined;

            // === Render Node UI ===
            return (
                <div style={nodeStyles.container} key={id}>
                    <NodeHeader
                        label={label}
                        description={description}
                        mode={mode}
                        onModeChange={handleModeChange || (() => {})}
                        canBeTool={can_be_tool}
                        nodeId={id}
                        execution_status={data.execution_status}
                    />

                    {/* Inputs Configuration */}
                    <InputsSection
                        spec_inputs={nodeSpec.inputs}
                        input_values={input_values}
                        nodeId={id}
                        onInputValueChange={
                            handleInputValueChange || (() => {})
                        }
                        node_mode={mode}
                    />

                    {/* Outputs Display */}
                    <OutputsSection
                        spec_outputs={nodeSpec.outputs}
                        node_mode={mode}
                    />

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
