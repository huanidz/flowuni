import { create } from 'zustand';
import { type Flow } from '../types';

import { type Node, type Edge } from '@xyflow/react';

export interface FlowStore {
  current_flow: Flow | null;
  flows: Flow[];
  loaded: boolean;
  selectedNodeId: string | null;
  isSidebarCollapsed: boolean;
  setCurrentFlow: (flow: Flow | null) => void;
  setFlows: (flows: Flow[]) => void;
  setLoaded: (loaded: boolean) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  getFlow: (flowId: string) => Flow | undefined;
  getAllFlows: () => Flow[];
  getFlowNames: () => string[];
}

const useFlowStore = create<FlowStore>((set, get) => ({
  current_flow: null,
  flows: [],
  loaded: false,
  selectedNodeId: null,
  isSidebarCollapsed: false,

  setCurrentFlow: (flow) => set({ current_flow: flow }),

  setFlows: (flows) => set({ flows }),
  
  setLoaded: (loaded) => set({ loaded }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  getFlow: (flowId) => {
    const { flows } = get();
    return flows.find(flow => flow.flow_id === flowId);
  },

  getAllFlows: () => {
    const { flows } = get();
    return flows;
  },

  getFlowNames: () => {
    const { flows } = get();
    return flows.map(flow => flow.flow_id);
  },
}));


// CurrentFlowStore

export interface CurrentFlowStore {
  nodes: Node[];
  edges: Edge[];
}


export default useFlowStore;