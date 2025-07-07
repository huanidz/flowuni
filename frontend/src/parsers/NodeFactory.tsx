import React from "react";
import nodeRegistry from "./NodeRegistry";
import { Handle, Position, type Node as RFNode, type NodeProps } from "@xyflow/react";

interface NodeParameterSpec {
  default: any;
  type?: string;
  [key: string]: any;
}

interface NodeSpec {
  name: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
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
      const { label = nodeSpec.name, parameters = {} } = data;

      return (
        <div style={{
            border: '1px solid #777',
            padding: '10px',
            borderRadius: '5px',
            background: 'white',
            minWidth: '180px'
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
            {Object.entries(nodeSpec.inputs).map(([key, type], index) => (
              <div key={key} style={{ textAlign: 'left' }}>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={key}
                  style={{ top: `${(index + 1) * 35 + 20}px` }}
                />
                <span style={{ marginLeft: '15px' }}>{key} ({type})</span>
              </div>
            ))}
          </div>

          {/* Render Parameter Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            {Object.entries(nodeSpec.parameters).map(([key, paramSpec]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                  {key}
                </label>
                <input
                  type={paramSpec.type || "text"}
                  defaultValue={parameters[key] ?? paramSpec.default}
                  className="nodrag" // Prevents node dragging when interacting with the input
                  style={{ width: '90%', padding: '4px' }}
                />
              </div>
            ))}
          </div>

          {/* Render Output Handles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(nodeSpec.outputs).map(([key, type], index) => (
              <div key={key} style={{ textAlign: 'right' }}>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={key}
                  style={{ top: `${(index + 1) * 35 + 20}px` }}
                />
                 <span style={{ marginRight: '15px' }}>{key} ({type})</span>
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