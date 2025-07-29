import { type Node as RFNode, type NodeProps } from '@xyflow/react';

export interface NodeParameterSpec {
  name: string;
  value: string;
  default: any;
  type?: string;
  description?: string;
  [key: string]: any;
}

export interface NodeInput {
  name: string;
  type: string;
  value?: string;
  default?: any;
  description?: string;
  required?: boolean;
}

export interface NodeOutput {
  name: string;
  type: string;
  value?: string;
  default?: any;
  description?: string;
}

export interface NodeSpec {
  name: string;
  description?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: Record<string, NodeParameterSpec>;
}

export interface NodeData {
  label: string;
  node_type: string;
  parameters: Record<string, any>;
  input_values?: Record<string, any>;
  output_values?: Record<string, any>;
  execution_result?: string;
  [key: string]: any;
}

export type CustomNodeProps = NodeProps<RFNode<NodeData>>;

export type UpdateNodeDataFunction = (nodeId: string, newData: any) => void;
export type UpdateNodeParameterFunction = (
  nodeId: string,
  parameterName: string,
  value: any
) => void;
