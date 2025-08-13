import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSection } from './SidebarSection';
import { SidebarInputsSection } from './SidebarInputsSection';
import { SidebarParametersSection } from './SidebarParametersSection';
import { SidebarToolConfigSection } from './SidebarToolConfigSection';
import { SidebarOutputsSection } from './SidebarOutputsSection';
import { SidebarExecutionResultSection } from './SidebarExecutionResultSection';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import type { NodeSpec } from '@/features/nodes';
import { type Node } from '@xyflow/react';
import type { NodeData } from '@/features/nodes/types';
import { NODE_DATA_MODE } from '@/features/flows/consts';

interface NodeConfigSidebarProps {
  selectedNode: Node<NodeData> | null;
  nodeSpec: NodeSpec | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  onInputValueChange: (inputName: string, value: any) => void;
  onParameterChange: (paramName: string, value: any) => void;
  onModeChange: (newMode: string) => void;
  onToolConfigChange: (toolConfigName: string, value: any) => void;
}

export const NodeConfigSidebar: React.FC<NodeConfigSidebarProps> = ({
  selectedNode,
  nodeSpec,
  isCollapsed,
  onToggleCollapse,
  onClose,
  onInputValueChange,
  onParameterChange,
  onModeChange,
  onToolConfigChange,
}) => {
  if (!selectedNode || !nodeSpec) {
    return null;
  }

  const {
    data: {
      input_values = {} as Record<string, any>,
      parameter_values = {} as Record<string, any>,
      output_values = {} as Record<string, any>,
      tool_configs = {} as Record<string, any>,
      mode = NODE_DATA_MODE.NORMAL,
      execution_result = null as string | null,
      execution_status = undefined as string | undefined,
    },
  } = selectedNode;

  const renderNodeHeaderSection = () => (
    <div style={sidebarStyles.nodeHeader}>
      <h2 style={sidebarStyles.nodeTitle}>{nodeSpec.name}</h2>
      {nodeSpec.description && (
        <p style={sidebarStyles.nodeDescription}>{nodeSpec.description}</p>
      )}
      {nodeSpec.can_be_tool && (
        <div style={sidebarStyles.modeSelector}>
          <span style={sidebarStyles.modeLabel}>Mode:</span>
          <select
            style={sidebarStyles.modeSelect}
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
          >
            <option value={NODE_DATA_MODE.NORMAL}>Normal</option>
            <option value={NODE_DATA_MODE.TOOL}>Tool</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderInputsSection = () => {
    if (nodeSpec.inputs.length === 0) {
      return <div style={sidebarStyles.emptyStateText}>No inputs</div>;
    }

    return (
      <SidebarInputsSection
        spec_inputs={nodeSpec.inputs}
        input_values={input_values}
        nodeId={selectedNode.id}
        onInputValueChange={onInputValueChange}
        node_mode={mode}
      />
    );
  };

  const renderParametersSection = () => {

    return null; // TODO: Current not supported.

    // if (nodeSpec.parameters.length === 0) {
    //   return <div style={sidebarStyles.emptyStateText}>No parameters</div>;
    // }

    // return (
    //   <SidebarParametersSection
    //     spec_parameters={nodeSpec.parameters}
    //     parameter_values={parameter_values}
    //     nodeId={selectedNode.id}
    //     onParameterChange={onParameterChange}
    //   />
    // );
  };

  const renderToolConfigSection = () => {
    if (mode !== NODE_DATA_MODE.TOOL) {
      return (
        <div style={sidebarStyles.emptyStateText}>
          No tool configuration while in normal mode.
        </div>
      );
    }

    return (
      <SidebarToolConfigSection
        tool_configs={tool_configs}
        onToolConfigChange={onToolConfigChange}
        mode={mode}
      />
    );
  };

  const renderOutputsSection = () => {
    if (nodeSpec.outputs.length === 0 && mode !== NODE_DATA_MODE.TOOL) {
      return <div style={sidebarStyles.emptyStateText}>No outputs</div>;
    }

    return (
      <SidebarOutputsSection
        spec_outputs={nodeSpec.outputs}
        node_mode={mode}
        output_values={output_values}
      />
    );
  };

  const renderExecutionResultsSection = () => {
    if (!execution_result && !execution_status) {
      return <div style={sidebarStyles.emptyStateText}>No execution results</div>;
    }

    return (
      <SidebarExecutionResultSection
        result={execution_result}
        status={execution_status || 'unknown'}
      />
    );
  };

  return (
    <div
      style={{
        ...sidebarStyles.container,
        ...(isCollapsed ? sidebarStyles.containerCollapsed : {}),
      }}
    >
      <SidebarHeader
        title="Node Configuration"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onClose={onClose}
      />
      <div style={sidebarStyles.content}>
        <SidebarSection title="Node Information" defaultCollapsed={false}>
          {renderNodeHeaderSection()}
        </SidebarSection>

        <SidebarSection title="Inputs" defaultCollapsed={false}>
          {renderInputsSection()}
        </SidebarSection>

        {/* <SidebarSection title="Parameters" defaultCollapsed={true}>
          {renderParametersSection()}
        </SidebarSection> */}

        {nodeSpec.can_be_tool && (
          <SidebarSection title="Tool Configuration" defaultCollapsed={true}>
            {renderToolConfigSection()}
          </SidebarSection>
        )}

        {/* <SidebarSection title="Outputs" defaultCollapsed={true}>
          {renderOutputsSection()}
        </SidebarSection> */}

        <SidebarSection title="Execution Results" defaultCollapsed={true}>
          {renderExecutionResultsSection()}
        </SidebarSection>
      </div>
    </div>
  );
};