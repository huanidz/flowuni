import { create } from 'zustand';
import { nanoid } from 'nanoid';

interface ExecutionStore {
    sessionId: string;
    isSessionEnabled: boolean;
    setSessionId: (sessionId: string) => void;
    resetSessionId: () => void;
    setSessionEnabled: (enabled: boolean) => void;
}

const useExecutionStore = create<ExecutionStore>((set, get) => ({
    sessionId: nanoid(),
    isSessionEnabled: false,

    setSessionId: (sessionId: string) => set({ sessionId }),

    resetSessionId: () => set({ sessionId: nanoid() }),

    setSessionEnabled: (enabled: boolean) => set({ isSessionEnabled: enabled }),
}));

export default useExecutionStore;
