import { create } from 'zustand';
import { type Flow } from '../types';

export interface FlowStore {
  current_flow: Flow | null;
  flows: Flow[];
  loaded: boolean;
  setCurrentFlow: (flow: Flow | null) => void;
  setFlows: (flows: Flow[]) => void;
  setLoaded: (loaded: boolean) => void;
  getFlow: (flowId: string) => Flow | undefined;
  getAllFlows: () => Flow[];
  getFlowNames: () => string[];
}

const useFlowStore = create<FlowStore>((set, get) => ({
  current_flow: null,
  flows: [],
  loaded: false,

  setCurrentFlow: (flow) => set({ current_flow: flow }),

  setFlows: (flows) => set({ flows }),
  
  setLoaded: (loaded) => set({ loaded }),

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

export default useFlowStore;