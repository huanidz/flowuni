import type { Edge, Node, Connection } from "@xyflow/react";
import type { NodeSpec } from "@/features/nodes";
import type { TypeDetail, NodeInput } from "@/features/nodes/types";
import { useNodeStore } from "@/features/nodes";
import { NODE_DATA_MODE } from "../consts";

export class ConnectionValidator {
    private edges: Edge[] = [];
    private nodes: Node[] = [];
    private getNodeSpecByRFNodeType: (nodeName: string) => NodeSpec | undefined;

    constructor(
        edges: Edge[], 
        nodes: Node[], 
        getNodeSpecByRFNodeType: (nodeName: string) => NodeSpec | undefined // Pass the function
    ) {
        this.edges = edges;
        this.nodes = nodes;
        this.getNodeSpecByRFNodeType = getNodeSpecByRFNodeType; // Store it
    }

    
    isValidConnection = (connection: Connection | Edge): boolean => {
        
        const { source, target, sourceHandle, targetHandle } = connection;

        console.log("=========")

        // Rule 1: Prevent self-connection
        if (source === target) {
            console.warn('Self-connection not allowed');
            return false;
        }

        console.log('Source:', source);
        console.log('Target:', target);
        console.log('Source Handle:', sourceHandle);
        console.log('Target Handle:', targetHandle);

        // Get source and target nodes
        const sourceNode = this.nodes.find(n => n.id === source);
        const targetNode = this.nodes.find(n => n.id === target);

        if (!sourceNode || !targetNode) {
            console.warn('Source or target node not found');
            return false;
        }

        console.log('Source Node:', sourceNode);
        console.log('Target Node:', targetNode);

        // Getting node spec
        const sourceNodeSpec = this.getNodeSpecByRFNodeType(sourceNode?.type || '');
        const targetNodeSpec = this.getNodeSpecByRFNodeType(targetNode?.type || '');

        console.log('Source Node Spec:', sourceNodeSpec);
        console.log('Target Node Spec:', targetNodeSpec);

        // Get the index of the target handle
        // NOTE: never get the source handle index because it can be undefined (due to the ToolNode does not have a source handle id)
        const targetHandleIndex = targetHandle?.split(':')[1];
        console.log('Target Handle Index:', targetHandleIndex);

        if (!targetHandleIndex) {
            console.warn('Target handle index not found');
            return false;
        }

        // Convert string index to number for array access
        const targetHandleIndexNum = parseInt(targetHandleIndex, 10);
        if (isNaN(targetHandleIndexNum)) {
            console.warn('Invalid target handle index format');
            return false;
        }

        const TargetInputHandle = targetNodeSpec?.inputs[targetHandleIndexNum];
        
        if (!TargetInputHandle) {
            console.warn('Target input handle not found');
            return false;
        }
        
        if (TargetInputHandle.allow_incoming_edges === false) {
            return false;
        }

        // Compare type
        let SourceOutputHandle = null;
        if (sourceHandle == null) {
            // Meaning the source node is a ToolNode
            // One and only one source handle must existed for ToolNode 
            SourceOutputHandle = sourceNodeSpec?.outputs[0];
        } else {
            const sourceHandleIndex = sourceHandle?.split(':')[1];
            if (!sourceHandleIndex) {
                console.warn('Source handle index not found');
                return false;
            }

            // Convert string index to number for array access
            const sourceHandleIndexNum = parseInt(sourceHandleIndex, 10);
            if (isNaN(sourceHandleIndexNum)) {
                console.warn('Invalid source handle index format');
                return false;
            }

            SourceOutputHandle = sourceNodeSpec?.outputs[sourceHandleIndexNum];
        }

        if (this.areTypesCompatible(sourceNode.data.mode as string, SourceOutputHandle.type_detail, TargetInputHandle.type_detail)) {
            console.log('Types are compatible');
        } else {
            console.warn('Types are incompatible');
            return false;
        }


        // Check if target input can accept another connection
        if (!this.canInputAcceptConnection(target, targetHandle, TargetInputHandle)) {
            console.warn('Target input cannot accept another connection');
            return false;
        }

        return true;
    };

    private areTypesCompatible(source_node_mode: string, sourceTypeDetail: TypeDetail, targetTypeDetail: TypeDetail): boolean {
        let sourceTypeName = sourceTypeDetail.type;
        let targetTypeName = targetTypeDetail.type;

        console.log('Source Type Name:', sourceTypeName);
        console.log('Target Type Name:', targetTypeName);

        if (source_node_mode == NODE_DATA_MODE.TOOL) {
            sourceTypeName = 'ToolOutputHandle';
        }
    
        // Define compatibility matrix based on your TypeDetail types
        const compatibilityMatrix: { [key: string]: string[] } = {
            'DataOutputHandle': ["TextFieldInputHandle", "DropdownInputHandle", "SecretTextInputHandle", "NumberInputHandle", "BooleanInputHandle", "FileInputHandle"],
            'ToolOutputHandle': ["AgentToolInputHandle"],
        };
    
        const compatibleTargets = compatibilityMatrix[sourceTypeName] || [];
        return compatibleTargets.includes(targetTypeName);
    }
    /**
     * Check if target input can accept another connection
     */
    private canInputAcceptConnection(
        targetNodeId: string, 
        targetHandleId: string | null, 
        inputSpec: any
    ): boolean {
        // If input allows multiple connections, always allow
        if (inputSpec.allow_multiple_incoming_edges) {
            return true;
        }
    
        // Count existing connections to this target handle
        const existingConnections = this.edges.filter(edge => 
            edge.target === targetNodeId && edge.targetHandle === targetHandleId
        );
    
        // Allow connection if no existing connections (single connection rule)
        return existingConnections.length === 0;
    }
}


//     /**
//      * Check if two TypeDetails are compatible
//      */


// }