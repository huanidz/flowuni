import React from "react";
import nodeRegistry from "./NodeRegistry";
import { Handle, Position, type Node as RFNode, type NodeProps } from "@xyflow/react";

interface NodeParameterSpec {
  name: string;
  default: any;
  type?: string;
  description?: string;
  [key: string]: any;
}

interface NodeInput {
  name: string;
  type: string;
  default?: any;
  description?: string;
  required?: boolean;
}

interface NodeOutput {
  name: string;
  type: string;
  default?: any;
  description?: string;
}

interface NodeSpec {
  name: string;
  description?: string;
  inputs: NodeInput[]; // Changed from Dict to List
  outputs: NodeOutput[]; // Changed from Dict to List
  parameters: Record<string, NodeParameterSpec>;
}

interface NodeData {
  label: string;
  nodeType: string;
  parameters: Record<string, any>;
  [key: string]: any; // Add index signature
}

type CustomNodeProps = NodeProps<RFNode<NodeData>>;

class NodeFactoryClass {
  // Create a ReactFlow node component for a given node type
  createNodeComponent(nodeType: string): React.FC<CustomNodeProps> | null {
    const nodeSpec = nodeRegistry.getNode(nodeType) as NodeSpec | undefined;

    console.log('NodeSpec:', nodeSpec);

    if (!nodeSpec) {
      console.error(`Node type "${nodeType}" not found in registry`);
      return null;
    }

    const CustomNode: React.FC<CustomNodeProps> = ({ data, id }) => {
      const { label = nodeSpec.name, parameters = {} } = data;

      return (
        <div style={{
            border: '1px solid #777',
            padding: '10px',
            borderRadius: '5px',
            background: 'white',
            minWidth: '180px',
            position: 'relative'
           }}>
          <div style={{
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '10px',
              paddingBottom: '5px',
              borderBottom: '1px solid #eee'
             }}>
            {label}
          </div>

          {/* Render Input Handles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            {nodeSpec.inputs.map((input, index) => (
              <div key={`input-${index}`} style={{ 
                position: 'relative', 
                textAlign: 'left',
                height: '20px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`input-${index}`}
                  style={{ 
                    position: 'absolute',
                    left: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 12, 
                    height: 12 
                  }}
                />
                <span style={{ marginLeft: '15px' }}>
                  {input.name} {index + 1} ({input.type})
                  {input.required && <span style={{ color: 'red' }}>*</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Render Parameter Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            {Object.entries(nodeSpec.parameters).map(([key, paramSpec]) => {
              // Safe default value extraction
              const getDefaultValue = (spec: NodeParameterSpec) => {
                if (spec.default !== undefined && spec.default !== null) {
                  // If it's an object, convert to string for display
                  if (typeof spec.default === 'object') {
                    return JSON.stringify(spec.default);
                  }
                  return spec.default;
                }
                return '';
              };

              return (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                    {key}
                    {paramSpec.description && (
                      <span style={{ color: '#666', fontSize: '10px' }}>
                        {' '}({paramSpec.description})
                      </span>
                    )}
                  </label>
                  <input
                    type={paramSpec.type || "text"}
                    defaultValue={parameters[key] ?? getDefaultValue(paramSpec)}
                    className="nodrag" // Prevents node dragging when interacting with the input
                    style={{ width: '90%', padding: '4px' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Render Output Handles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeSpec.outputs.map((output, index) => (
              <div key={`output-${index}`} style={{ 
                position: 'relative', 
                textAlign: 'right',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`output-${index}`}
                  style={{ 
                    position: 'absolute',
                    right: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 12, 
                    height: 12 
                  }}
                />
                <span style={{ marginRight: '15px' }}>
                  {output.name} {index + 1} ({output.type})
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    CustomNode.displayName = `${nodeSpec.name.replace(/\s+/g, '')}Node`;
    return CustomNode;
  }
}

// Export the class as a constant
export const NodeFactory = new NodeFactoryClass();