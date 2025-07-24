import { create } from 'zustand';
import { type Flow } from './types';

export interface FlowStore {
  flows: Flow[];
  loaded: boolean;
  setFlows: (flows: Flow[]) => void;
  setLoaded: (loaded: boolean) => void;
  getFlow: (flowId: string) => Flow | undefined;
  getAllFlows: () => Flow[];
}

const useFlowStore = create<FlowStore>((set, get) => ({
  flows: [],
  loaded: false,

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