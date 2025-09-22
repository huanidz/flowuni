import { create } from 'zustand';
import type { LLMJudge } from './types';

interface LLMJudgeStore {
    llmJudges: LLMJudge[];
    loaded: boolean;
    setLLMJudges: (llmJudges: LLMJudge[]) => void;
    setLoaded: (loaded: boolean) => void;
    addLLMJudge: (llmJudge: LLMJudge) => void;
    updateLLMJudge: (id: number, updatedLLMJudge: Partial<LLMJudge>) => void;
    removeLLMJudge: (id: number) => void;
    getLLMJudgeById: (id: number) => LLMJudge | undefined;
}

const useLLMJudgeStore = create<LLMJudgeStore>((set, get) => ({
    llmJudges: [],
    loaded: false,

    setLLMJudges: llmJudges => set({ llmJudges }),

    setLoaded: loaded => set({ loaded }),

    addLLMJudge: llmJudge => {
        const { llmJudges } = get();
        set({ llmJudges: [...llmJudges, llmJudge] });
    },

    updateLLMJudge: (id, updatedLLMJudge) => {
        const { llmJudges } = get();
        set({
            llmJudges: llmJudges.map(judge =>
                judge.id === id ? { ...judge, ...updatedLLMJudge } : judge
            ),
        });
    },

    removeLLMJudge: id => {
        const { llmJudges } = get();
        set({ llmJudges: llmJudges.filter(judge => judge.id !== id) });
    },

    getLLMJudgeById: id => {
        const { llmJudges } = get();
        return llmJudges.find(judge => judge.id === id);
    },
}));

export default useLLMJudgeStore;
