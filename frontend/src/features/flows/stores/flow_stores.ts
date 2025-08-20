import { create } from 'zustand';
import { type Flow } from '../types';

interface Position {
    x: number;
    y: number;
}

export interface FlowStore {
    current_flow: Flow | null;
    flows: Flow[];
    loaded: boolean;
    selectedNodeId: string | null;
    isSidebarCollapsed: boolean;
    isPlaygroundOpen: boolean;
    playgroundPosition: Position;
    setCurrentFlow: (flow: Flow | null) => void;
    setFlows: (flows: Flow[]) => void;
    setLoaded: (loaded: boolean) => void;
    setSelectedNodeId: (nodeId: string | null) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setPlaygroundOpen: (open: boolean) => void;
    setPlaygroundPosition: (position: Position) => void;
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
    isPlaygroundOpen: false,
    playgroundPosition: { x: 0, y: 0 },

    setCurrentFlow: flow => set({ current_flow: flow }),

    setFlows: flows => set({ flows }),

    setLoaded: loaded => set({ loaded }),

    setSelectedNodeId: nodeId => set({ selectedNodeId: nodeId }),

    setSidebarCollapsed: collapsed => set({ isSidebarCollapsed: collapsed }),

    setPlaygroundOpen: open => set({ isPlaygroundOpen: open }),

    setPlaygroundPosition: position => set({ playgroundPosition: position }),

    getFlow: flowId => {
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
