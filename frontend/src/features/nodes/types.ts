import { type Node as RFNode, type NodeProps } from '@xyflow/react';

export interface NodeParameterSpec {
    name: string;
    value: string;
    default: any;
    type_detail?: string;
    description?: string;
    [key: string]: any;
}

export interface DynamicTypeItem {
    type_label: string;
    type_name: string;
    details: any;
}

export interface TypeDetail {
    type: string;
    schema?: {
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
    allow_incoming_edges: boolean;
    allow_multiple_incoming_edges: boolean;

    enable_as_whole_for_tool?: boolean;
}

export interface NodeOutput {
    name: string;
    type_detail: TypeDetail;
    value: any;
    default: any;
    description: string;

    enable_for_tool?: boolean;
}

export interface NodeSpec {
    name: string;
    description?: string;
    inputs: NodeInput[];
    outputs: NodeOutput[];
    parameters: NodeParameterSpec[];

    can_be_tool?: boolean;
}

// --- Node Data ---
// This is where client pass data back to the backend

export interface NodeData {
    label: string;
    node_type: string;
    parameter_values: Record<string, any>;
    input_values?: Record<string, any>;
    output_values?: Record<string, any>;

    // Tool related fields
    tool_configs?: Record<string, any>; // Note: this only can happen in Tool-able Node. else None by default

    // Mode-related fields
    mode?: string;

    // Execution-related fields
    execution_result?: string;
    execution_status?: string;
    [key: string]: any;
}

export type CustomNodeProps = NodeProps<RFNode<NodeData>>;

export type UpdateNodeInputDataFunction = (
    nodeId: string,
    inputName: string,
    newData: any
) => void;
export type UpdateNodeModeDataFunction = (
    nodeId: string,
    newMode: string
) => void;
export type UpdateNodeParameterFunction = (
    nodeId: string,
    parameterName: string,
    value: any
) => void;

export type UpdateNodeToolConfigFunction = (
    nodeId: string,
    toolConfigName: string,
    value: any
) => void;

export type UpdateNodeExecutionResultFunction = (
    nodeId: string,
    result: string
) => void;
export type UpdateNodeExecutionStatusFunction = (
    nodeId: string,
    status: string
) => void;
