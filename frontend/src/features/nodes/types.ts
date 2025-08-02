import { type Node as RFNode, type NodeProps } from '@xyflow/react';

export interface NodeParameterSpec {
  name: string;
  value: string;
  default: any;
  type_detail?: string;
  description?: string;
  [key: string]: any;
}

export interface TypeDetail {
  type: string;
  schema: {
    description: string;
    properties: Record<string, any>;
    title: string;
    type: string;
  };
  defaults: Record<string, any>;
}

export interface NodeInput {
  name: string;
  type_detail: TypeDetail;
  value: any;
  default: any;
  description: string;
  required: boolean;
}

export interface NodeOutput {
  name: string;
  type_detail: TypeDetail;
  value: any;
  default: any;
  description: string;
}

export interface NodeSpec {
  name: string;
  description?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: NodeParameterSpec[];
}

// --- Node Data ---
// This is where client pass data back to the backend

export interface NodeData {
  label: string;
  node_type: string;
  parameter_values: Record<string, any>;
  input_values?: Record<string, any>;
  output_values?: Record<string, any>;

  // Execution-related fields
  execution_result?: string;
  execution_status?: string;
  [key: string]: any;
}

export type CustomNodeProps = NodeProps<RFNode<NodeData>>;

export type UpdateNodeDataFunction = (nodeId: string, newData: any) => void;
export type UpdateNodeParameterFunction = (
  nodeId: string,
  parameterName: string,
  value: any
) => void;
