import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface ExecutionStore {
    sessionId: string;
    isSessionEnabled: boolean;
    setSessionId: (sessionId: string) => void;
    resetSessionId: () => void;
    setSessionEnabled: (enabled: boolean) => void;
}

const useExecutionStore = create<ExecutionStore>((set, get) => ({
    sessionId: uuidv4(),
    isSessionEnabled: false,

    setSessionId: (sessionId: string) => set({ sessionId }),

    resetSessionId: () => set({ sessionId: uuidv4() }),

    setSessionEnabled: (enabled: boolean) => set({ isSessionEnabled: enabled }),
}));

export default useExecutionStore;
