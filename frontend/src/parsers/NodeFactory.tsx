import React from "react";
import nodeRegistry from "./NodeRegistry";
import { Handle, Position, type Node as RFNode, type NodeProps } from "@xyflow/react";
import { NodeInputType } from "@/types/NodeIOHandleType";
import { HandleComponentRegistry } from "@/components/handles/HandleComponentRegistry";

interface NodeParameterSpec {
  name: string;
  value: string;
  default: any;
  type?: string;
  description?: string;
  [key: string]: any;
}

interface NodeInput {
  name: string;
  type: string;
  value?: string;
  default?: any;
  description?: string;
  required?: boolean;
}

interface NodeOutput {
  name: string;
  type: string;
  value?: string;
  default?: any;
  description?: string;
}

interface NodeSpec {
  name: string;
  description?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: Record<string, NodeParameterSpec>;
}

interface NodeData {
  label: string;
  nodeType: string;
  parameters: Record<string, any>;
  inputValues?: Record<string, any>;
  [key: string]: any;
}

type CustomNodeProps = NodeProps<RFNode<NodeData>>;

class NodeFactoryClass {
  createNodeComponent(
    nodeType: string,
    updateNodeData?: (nodeId: string, newData: any) => void,
    updateNodeParameter?: (nodeId: string, parameterName: string, value: any) => void
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

      const handleParameterChange = (paramName: string, value: any) => {
        console.log(`Parameter changed: ${paramName} = ${value} for node ${id}`);
        if (updateNodeParameter) {
          updateNodeParameter(id, paramName, value);
        }
      };

      const handleInputValueChange = (inputName: string, value: any) => {
        console.log(`Input value changed: ${inputName} = ${value} for node ${id}`);
        if (updateNodeData) {
          updateNodeData(id, {
            inputValues: {
              ...inputValues,
              [inputName]: value
            }
          });
        }
      };

      return (
        <div style={{
          border: '1px solid #777',
          padding: '12px',
          borderRadius: '8px',
          background: 'white',
          minWidth: '220px',
          position: 'relative',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #eee',
            color: '#333'
          }}>
            {label}
          </div>

          {/* Parameters Section */}
          {Object.keys(nodeSpec.parameters).length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: '#666'
              }}>
                Parameters
              </div>
              {Object.entries(nodeSpec.parameters).map(([paramName, paramSpec]) => {
                const InputComponent = HandleComponentRegistry[NodeInputType.TextField];
                
                return (
                  <div key={paramName} style={{ marginBottom: '8px' }}>
                    {InputComponent && (
                      <InputComponent
                        label={paramSpec.name}
                        description={paramSpec.description}
                        value={parameters[paramName] || paramSpec.default}
                        onChange={(value: string) => handleParameterChange(paramName, value)}
                        nodeId={id}
                        parameterName={paramName}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inputs Section */}
          {nodeSpec.inputs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#666'
              }}>
                Inputs
              </div>
              {nodeSpec.inputs.map((input, index) => {
                const InputComponent = HandleComponentRegistry[input.type];

                return (
                  <div key={`input-${index}`} style={{ position: 'relative' }}>
                    {/* Input Handle */}
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={`input-${index}`}
                      style={{
                        position: 'absolute',
                        left: '-6px',
                        top: '12px',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#555',
                        border: '2px solid white'
                      }}
                    />

                    {/* Input Info */}
                    <div style={{ paddingLeft: '12px', fontSize: '12px', color: '#333' }}>
                      <strong>{input.name}</strong>
                      {input.description && <span style={{ color: '#666' }}> - {input.description}</span>}
                      {input.required && <span style={{ color: 'red' }}> *</span>}
                    </div>

                    {/* Input Component for default values */}
                    {InputComponent && (
                      <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
                        <InputComponent
                          label=""
                          value={inputValues[input.name] || input.default || ""}
                          onChange={(value: string) => handleInputValueChange(input.name, value)}
                          nodeId={id}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Outputs Section */}
          {nodeSpec.outputs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#666'
              }}>
                Outputs
              </div>
              {nodeSpec.outputs.map((output, index) => (
                <div key={`output-${index}`} style={{
                  position: 'relative',
                  textAlign: 'right',
                  height: '24px',
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
                      height: 12,
                      borderRadius: '50%',
                      background: '#555',
                      border: '2px solid white'
                    }}
                  />
                  <span style={{ 
                    marginRight: '16px', 
                    fontSize: '12px',
                    color: '#333'
                  }}>
                    <strong>{output.name}</strong>
                    {output.description && <span style={{ color: '#666' }}> - {output.description}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    CustomNode.displayName = `${nodeSpec.name.replace(/\s+/g, '')}Node`;
    return CustomNode;
  }
}

export const NodeFactory = new NodeFactoryClass();