import type { Edge, Node, Connection } from '@xyflow/react';
import type { NodeSpec } from '@/features/nodes';
import type { IOTypeDetail, NodeInput } from '@/features/nodes/types';
import { NODE_DATA_MODE } from '../consts';

export class ConnectionValidator {
    private edges: Edge[];
    private nodes: Node[];
    private getNodeSpecByRFNodeType: (nodeName: string) => NodeSpec | undefined;

    constructor(
        edges: Edge[],
        nodes: Node[],
        getNodeSpecByRFNodeType: (nodeName: string) => NodeSpec | undefined
    ) {
        this.edges = edges;
        this.nodes = nodes;
        this.getNodeSpecByRFNodeType = getNodeSpecByRFNodeType;
    }

    isValidConnection = (connection: Connection | Edge): boolean => {
        const { source, target, sourceHandle, targetHandle } = connection;

        // Rule 1: Prevent self-connection
        if (source === target) {
            console.warn('Self-connection not allowed');
            return false;
        }

        // Get source and target nodes
        const sourceNode = this.nodes.find(n => n.id === source);
        const targetNode = this.nodes.find(n => n.id === target);

        if (!sourceNode || !targetNode) {
            console.warn('Source or target node not found');
            return false;
        }

        // Get node specifications
        const sourceNodeSpec = this.getNodeSpecByRFNodeType(
            sourceNode.type ?? ''
        );
        const targetNodeSpec = this.getNodeSpecByRFNodeType(
            targetNode.type ?? ''
        );

        if (!sourceNodeSpec || !targetNodeSpec) {
            console.warn('Node specification not found');
            return false;
        }

        // Get target input handle
        const targetInputHandle = this.getTargetInputHandle(
            targetHandle ?? null,
            targetNodeSpec
        );
        if (!targetInputHandle) {
            console.warn('Target input handle not found or invalid');
            return false;
        }

        if (targetInputHandle.allow_incoming_edges === false) {
            return false;
        }

        // Get source output handle
        const sourceOutputHandle = this.getSourceOutputHandle(
            sourceHandle ?? null,
            sourceNodeSpec
        );
        if (!sourceOutputHandle) {
            console.warn('Source output handle not found');
            return false;
        }

        // Check type compatibility
        const sourceNodeMode = sourceNode.data?.mode as string;
        if (
            !this.areTypesCompatible(
                sourceNodeMode,
                sourceOutputHandle.type_detail,
                targetInputHandle.type_detail
            )
        ) {
            console.warn('Types are incompatible');
            return false;
        }

        // Check if target input can accept another connection
        if (
            !this.canInputAcceptConnection(
                target,
                targetHandle ?? null,
                targetInputHandle
            )
        ) {
            console.warn('Target input cannot accept another connection');
            return false;
        }

        // Check if RouterOutputHandle already has a connection to this target node
        if (
            sourceOutputHandle.type_detail.type === 'RouterOutputHandle' &&
            !this.canRouterOutputConnectToTarget(source, target)
        ) {
            console.warn(
                'RouterOutputHandle already has a connection to this target node'
            );
            return false;
        }

        return true;
    };

    private getTargetInputHandle(
        targetHandle: string | null,
        targetNodeSpec: NodeSpec
    ): NodeInput | null {
        if (!targetHandle) {
            console.warn('Target handle not provided');
            return null;
        }

        const handleIndex = this.extractHandleIndex(targetHandle);
        if (handleIndex === null) return null;

        return targetNodeSpec.inputs[handleIndex] || null;
    }

    private getSourceOutputHandle(
        sourceHandle: string | null,
        sourceNodeSpec: NodeSpec
    ) {
        // ToolNode case: no source handle ID, use first output
        if (sourceHandle === null) {
            return sourceNodeSpec.outputs[0] || null;
        }

        const handleIndex = this.extractHandleIndex(sourceHandle);
        if (handleIndex === null) return null;

        return sourceNodeSpec.outputs[handleIndex] || null;
    }

    private extractHandleIndex(handle: string): number | null {
        const parts = handle.split(':');
        if (parts.length < 2) {
            console.warn('Invalid handle format');
            return null;
        }

        const index = parseInt(parts[1], 10);
        if (isNaN(index)) {
            console.warn('Invalid handle index format');
            return null;
        }

        return index;
    }

    private areTypesCompatible(
        sourceNodeMode: string,
        sourceIOTypeDetail: IOTypeDetail,
        targetIOTypeDetail: IOTypeDetail
    ): boolean {
        let sourceTypeName = sourceIOTypeDetail.type;
        const targetTypeName = targetIOTypeDetail.type;

        // Override source type for tool nodes
        if (sourceNodeMode === NODE_DATA_MODE.TOOL) {
            sourceTypeName = 'ToolOutputHandle';
        }

        const compatibilityMatrix: Record<string, string[]> = {
            DataOutputHandle: [
                'TextFieldInputHandle',
                'DropdownInputHandle',
                'SecretTextInputHandle',
                'NumberInputHandle',
                'BooleanInputHandle',
                'FileInputHandle',
                'DynamicTypeInputHandle',
            ],
            ToolOutputHandle: ['AgentToolInputHandle'],
            NumberOutputHandle: [
                'NumberInputHandle',
                'TextFieldInputHandle',
                'SecretTextInputHandle',
                'BooleanInputHandle',
                'DynamicTypeInputHandle',
            ],
            StringOutputHandle: [
                'TextFieldInputHandle',
                'DropdownInputHandle',
                'SecretTextInputHandle',
                'NumberInputHandle',
                'BooleanInputHandle',
                'DynamicTypeInputHandle',
            ],
            RouterOutputHandle: [
                'TextFieldInputHandle',
                'DropdownInputHandle',
                'SecretTextInputHandle',
                'NumberInputHandle',
                'BooleanInputHandle',
                'DynamicTypeInputHandle',
            ],
            LLMProviderOutputHandle: ['LLMProviderInputHandle'],
            EmbeddingProviderOutputHandle: ['EmbeddingProviderInputHandle'],
        };

        const compatibleTargets = compatibilityMatrix[sourceTypeName] || [];
        return compatibleTargets.includes(targetTypeName);
    }

    private canInputAcceptConnection(
        targetNodeId: string,
        targetHandleId: string | null,
        handleInputSpec: NodeInput
    ): boolean {
        // If input allows multiple connections, always allow
        if (handleInputSpec.allow_multiple_incoming_edges) {
            return true;
        }

        // Count existing connections to this target handle
        const existingConnections = this.edges.filter(
            edge =>
                edge.target === targetNodeId &&
                edge.targetHandle === targetHandleId
        );

        // Allow connection if no existing connections (single connection rule)
        return existingConnections.length === 0;
    }

    private canRouterOutputConnectToTarget(
        sourceNodeId: string,
        targetNodeId: string
    ): boolean {
        // Check if there's already a connection from any RouterOutputHandle to this target node
        const existingRouterConnections = this.edges.filter(edge => {
            // Find the source node to check if it has RouterOutputHandle
            const sourceNode = this.nodes.find(n => n.id === edge.source);
            if (!sourceNode) return false;

            // Get the source node specification
            const sourceNodeSpec = this.getNodeSpecByRFNodeType(
                sourceNode.type ?? ''
            );
            if (!sourceNodeSpec) return false;

            // Get the source output handle
            const sourceOutputHandle = this.getSourceOutputHandle(
                edge.sourceHandle ?? null,
                sourceNodeSpec
            );
            if (!sourceOutputHandle) return false;

            // Check if this is a RouterOutputHandle and connected to our target node
            return (
                sourceOutputHandle.type_detail.type === 'RouterOutputHandle' &&
                edge.target === targetNodeId
            );
        });

        // Allow connection if no existing RouterOutputHandle connections to this target node
        return existingRouterConnections.length === 0;
    }
}
