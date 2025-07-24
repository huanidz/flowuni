import { create } from 'zustand';
import { type NodeSpec } from './types';

export interface NodeStore {
  nodes: NodeSpec[];
  loaded: boolean;
  setNodes: (nodes: NodeSpec[]) => void;
  setLoaded: (loaded: boolean) => void;
  getNode: (nodeName: string) => NodeSpec | undefined;
  getAllNodes: () => NodeSpec[];
  getNodeNames: () => string[];
  getInputPorts: (nodeName: string) => string[];
  getOutputPorts: (nodeName: string) => string[];
  getParameters: (nodeName: string) => Record<string, any>;
  canConnect: (
    sourceNodeName: string,
    sourcePort: string,
    targetNodeName: string,
    targetPort: string
  ) => boolean;
}

const useNodeStore = create<NodeStore>((set, get) => ({
  nodes: [],
  loaded: false,

  setNodes: (nodes: NodeSpec[]) => set({ nodes }),
  
  setLoaded: (loaded: boolean) => set({ loaded }),

  getNode: (nodeName: string) => {
    const { nodes } = get();
    return nodes.find(node => node.name === nodeName);
  },

  getAllNodes: () => {
    const { nodes } = get();
    return nodes;
  },

  getNodeNames: () => {
    const { nodes } = get();
    return nodes.map(node => node.name);
  },

  getInputPorts: (nodeName: string) => {
    const node = get().getNode(nodeName);
    return node ? Object.keys(node.inputs) : [];
  },

  getOutputPorts: (nodeName: string) => {
    const node = get().getNode(nodeName);
    return node ? Object.keys(node.outputs) : [];
  },

  getParameters: (nodeName: string) => {
    const node = get().getNode(nodeName);
    return node ? node.parameters : {};
  },

  canConnect: (
    sourceNodeName: string,
    sourcePort: string,
    targetNodeName: string,
    targetPort: string
  ) => {
    const { getNode } = get();
    const sourceNode = getNode(sourceNodeName);
    const targetNode = getNode(targetNodeName);

    if (!sourceNode || !targetNode) return false;

    const sourceType = sourceNode.outputs[sourcePort];
    const targetType = targetNode.inputs[targetPort];

    return sourceType === targetType;
  },
}));

export default useNodeStore;