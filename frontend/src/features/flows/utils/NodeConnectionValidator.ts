import type { Edge, Node, Connection } from "@xyflow/react";
import type { NodeSpec } from "@/features/nodes";
import type { TypeDetail } from "@/features/nodes/types";
import { useNodeStore } from "@/features/nodes";

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


        return true;
    };
    /**
    * Generate handle ID for outputs (sources)
    */
    private getOutputHandleId(output: any): string {
        return `output-${output.name}`;
    }
    
    /**
     * Generate handle ID for inputs (targets)
     */
    private getInputHandleId(input: any): string {
        return `input-${input.name}`;
    }
    
}


//     /**
//      * Check if two TypeDetails are compatible
//      */
//     private areTypesCompatible(sourceType: TypeDetail, targetType: TypeDetail): boolean {
//         const sourceTypeName = sourceType.type;
//         const targetTypeName = targetType.type;

//         // Define compatibility matrix based on your TypeDetail types
//         const compatibilityMatrix: { [key: string]: string[] } = {
//         // Basic types
//         'string': ['string', 'any', 'text'],
//         'number': ['number', 'integer', 'float', 'any'],
//         'integer': ['integer', 'number', 'any'],
//         'float': ['float', 'number', 'any'],
//         'boolean': ['boolean', 'any'],
        
//         // Complex types
//         'array': ['array', 'list', 'any'],
//         'list': ['list', 'array', 'any'],
//         'object': ['object', 'dict', 'any'],
//         'dict': ['dict', 'object', 'any'],
        
//         // Special types
//         'any': ['string', 'number', 'integer', 'float', 'boolean', 'array', 'list', 'object', 'dict', 'file', 'image', 'text'],
//         'file': ['file', 'any'],
//         'image': ['image', 'file', 'any'],
//         'text': ['text', 'string', 'any'],
        
//         // Add more types as needed based on your domain
//         'json': ['json', 'object', 'dict', 'any'],
//         'url': ['url', 'string', 'any'],
//         'email': ['email', 'string', 'any'],
//         };

//         const compatibleTargets = compatibilityMatrix[sourceTypeName] || [];
//         return compatibleTargets.includes(targetTypeName);
//     }

    // /**
    //  * Check if target input can accept another connection
    //  */
    // private canInputAcceptConnection(
    //     targetNodeId: string, 
    //     targetHandleId: string | null, 
    //     inputSpec: any
    // ): boolean {
    //     // If input allows multiple connections, always allow
    //     if (inputSpec.allow_multiple_incoming_edges) {
    //     return true;
    //     }

    //     // Count existing connections to this target handle
    //     const existingConnections = this.edges.filter(edge => 
    //     edge.target === targetNodeId && edge.targetHandle === targetHandleId
    //     );

    //     // Allow connection if no existing connections (single connection rule)
    //     return existingConnections.length === 0;
    // }

    // /**
    //  * Get all possible source handles for a node
    //  */
    // getNodeSourceHandles(nodeId: string): string[] {
    //     const node = this.nodes.find(n => n.id === nodeId);
    //     if (!node) return [];

    //     const nodeSpec = this.nodeSpecs.get(node.data.node_type);
    //     if (!nodeSpec) return [];

    //     return nodeSpec.outputs.map(output => this.getOutputHandleId(output));
    // }

    // /**
    //  * Get all possible target handles for a node
    //  */
    // getNodeTargetHandles(nodeId: string): string[] {
    //     const node = this.nodes.find(n => n.id === nodeId);
    //     if (!node) return [];

    //     const nodeSpec = this.nodeSpecs.get(node.data.node_type);
    //     if (!nodeSpec) return [];

    //     return nodeSpec.inputs
    //     .filter(input => input.allow_incoming_edges)
    //     .map(input => this.getInputHandleId(input));
    // }

    // /**
    //  * Validate all existing edges
    //  */
    // validateAllEdges(): { validEdges: Edge[], invalidEdges: Edge[] } {
    //     const validEdges: Edge[] = [];
    //     const invalidEdges: Edge[] = [];

    //     this.edges.forEach(edge => {
    //     if (this.isValidConnection(edge)) {
    //         validEdges.push(edge);
    //     } else {
    //         invalidEdges.push(edge);
    //     }
    //     });

    //     return { validEdges, invalidEdges };
    // }
// }