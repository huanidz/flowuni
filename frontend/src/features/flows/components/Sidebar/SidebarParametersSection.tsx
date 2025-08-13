import React from 'react';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import type { NodeParameterSpec } from '@/features/nodes/types';
import { NodeInputType } from '@/features/flows/handles/HandleComponentRegistry';

interface SidebarParametersSectionProps {
  spec_parameters: NodeParameterSpec[];
  parameter_values: Record<string, any>;
  nodeId: string;
  onParameterChange: (paramName: string, value: any) => void;
}

export const SidebarParametersSection: React.FC<SidebarParametersSectionProps> = ({
  spec_parameters,
  parameter_values,
  nodeId,
  onParameterChange,
}) => {
  const [expandedParameters, setExpandedParameters] = React.useState<Record<string, boolean>>({});

  if (spec_parameters.length === 0) return null;

  const toggleParameterExpanded = (paramName: string) => {
    setExpandedParameters(prev => ({
      ...prev,
      [paramName]: !prev[paramName]
    }));
  };

  return (
    <div style={sidebarStyles.section}>
      <div style={sidebarStyles.sectionTitle}>Parameters</div>
      {spec_parameters.map((paramSpec) => {
        const InputComponent = HandleComponentRegistry[NodeInputType.TextField];
        const paramValue = parameter_values[paramSpec.name];
        const isExpanded = expandedParameters[paramSpec.name] !== false;

        return (
          <div key={paramSpec.name} style={sidebarStyles.inputItem}>
            <div style={sidebarStyles.inputHeader}>
              <div style={sidebarStyles.inputInfo}>
                <div style={sidebarStyles.inputLabel}>{paramSpec.name}</div>
                {paramSpec.description && (
                  <div style={sidebarStyles.inputDescription}>
                    {paramSpec.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleParameterExpanded(paramSpec.name)}
                style={sidebarStyles.toggleButton}
                onMouseDown={(e) => e.preventDefault()}
                title={isExpanded ? 'Collapse parameter' : 'Expand parameter'}
              >
                {isExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                )}
              </button>
            </div>
            
            {isExpanded && InputComponent && (
              <div style={sidebarStyles.inputComponent}>
                <InputComponent
                  label={paramSpec.name}
                  description={paramSpec.description}
                  value={paramValue !== undefined ? paramValue : paramSpec.default}
                  onChange={(value: string) =>
                    onParameterChange(paramSpec.name, value)
                  }
                  nodeId={nodeId}
                  parameterName={paramSpec.name}
                  isSidebar={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};