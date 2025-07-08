import React from "react";
import nodeRegistry from "./NodeRegistry";
import { Handle, Position, type Node as RFNode, type NodeProps } from "@xyflow/react";
import { NodeInputType } from "@/types/NodeIOHandleType";
import { HandleComponentRegistry } from "@/components/handles/HandleComponentRegistry";

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

    if (!nodeSpec) {
      console.error(`Node type "${nodeType}" not found in registry`);
      return null;
    }

    const CustomNode: React.FC<CustomNodeProps> = ({ data, id }) => {
      const { label = nodeSpec.name, description = nodeSpec.description, parameters = {} } = data;


      // Only care about inputs and outputs. parameters will be handled by modal-toggle.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
            {nodeSpec.inputs.map((input, index) => {
              const InputComponent = HandleComponentRegistry[input.type];

              return (
                <div key={`input-${index}`} style={{ position: 'relative' }}>
                  {/* Left-side Handle Dot */}
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`input-${index}`}
                    style={{
                      position: 'absolute',
                      left: '-6px',
                      top: '10px',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#555',
                    }}
                  />

                  {/* Input Label */}
                  <div style={{ paddingLeft: '12px', fontSize: '12px', color: '#222' }}>
                    <strong>{input.name}</strong> {index + 1} ({input.type})
                    {input.required && <span style={{ color: 'red' }}> *</span>}
                  </div>

                  {/* Optional Input Component */}
                  {InputComponent && (
                    <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
                      <InputComponent
                        label={input.name}
                        description={input.description}
                        value={input.default}
                        onChange={(value: string) =>
                          console.log("Input value changed:", value)
                        }
                      />
                    </div>
                  )}
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