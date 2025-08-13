import React, { useMemo } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { HandleComponentRegistry, NodeInputType } from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import { nodeInputSectionStyles } from '@/features/flows/styles/nodeInputSectionStyles';
import type { NodeInput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';
import { NODE_DATA_MODE } from '@/features/flows/consts';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Configuration for default showInputComponent state by input type
const INPUT_TYPE_DEFAULT_VISIBILITY: Record<string, boolean> = {
  [NodeInputType.Table]: false,
  [NodeInputType.DynamicType]: true,
  // All other types default to true (not explicitly listed)
};

interface InputsSectionProps {
  spec_inputs: NodeInput[];
  input_values: Record<string, any>;
  nodeId: string;
  onInputValueChange: (inputName: string, value: any) => void;
  node_mode: string;
}

export const InputsSection: React.FC<InputsSectionProps> = ({
  spec_inputs,
  input_values,
  nodeId,
  onInputValueChange,
  node_mode
}) => {
  const edges = useEdges();

  const targetHandleEdges = useMemo(() => {
    return new Set(
      edges
        .filter(edge => edge.target === nodeId && edge.targetHandle)
        .map(edge => edge.targetHandle!)
    );
  }, [edges, nodeId]);

  if (spec_inputs.length === 0) return null;

  const renderInput = (spec_input: NodeInput, index: number) => {
    const InputComponent = HandleComponentRegistry[spec_input.type_detail.type];
    const hasInputComponent = !!InputComponent;
    const inputValue = input_values[spec_input.name];
    const handleId = `${spec_input.name}-index:${index}`;
    const isConnected = targetHandleEdges.has(handleId);
    const isToolMode = node_mode === NODE_DATA_MODE.TOOL && spec_input.enable_for_tool;
    const inputType = spec_input.type_detail.type;
    const defaultVisibility = INPUT_TYPE_DEFAULT_VISIBILITY[inputType] ?? true;
    const [showInputComponent, setShowInputComponent] = React.useState(defaultVisibility);
    
    // Handle DynamicTypeInput value format
    const effectiveValue = inputType === NodeInputType.DynamicType && inputValue && typeof inputValue === 'object' && inputValue.selectedTyped
      ? inputValue
      : inputValue ?? spec_input.default ?? '';

    const inputProps = {
      label: spec_input.name,
      value: effectiveValue,
      onChange: (value: any) => onInputValueChange(spec_input.name, value),
      nodeId,
      type_detail: spec_input.type_detail,
      disabled: isToolMode || isConnected
    };

    const toggleInputComponent = () => {
      setShowInputComponent(!showInputComponent);
    };

    return (
      <div key={`input-${index}`} style={nodeStyles.inputItem}>
        <div style={nodeInputSectionStyles.inputItemContainer}>
          <HandleInfo
            name={spec_input.name}
            description={spec_input.description}
            required={spec_input.required}
            helperText={isToolMode ? 'Tool Parameter' : ''}
          />
          {hasInputComponent && (
            <button
              onClick={toggleInputComponent}
              style={nodeInputSectionStyles.toggleButton}
              onMouseDown={(e) => e.preventDefault()}
              title={showInputComponent ? 'Hide input' : 'Show input'}
            >
              {showInputComponent ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
        </div>

        {!isToolMode && spec_input.allow_incoming_edges && (
          <Handle
            type="target"
            position={Position.Left}
            id={handleId}
            style={nodeStyles.handle.input}
          />
        )}

        {hasInputComponent && showInputComponent && (
          <div style={nodeStyles.inputComponent}>
            <InputComponent {...inputProps} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={nodeStyles.inputsSection}>
      <div style={nodeStyles.sectionTitle}>Inputs</div>
      {spec_inputs.map(renderInput)}
    </div>
  );
};