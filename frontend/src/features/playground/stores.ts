import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    PlaygroundSession,
    ChatMessage,
    GetPlaygroundSessionsResponse,
    GetChatHistoryResponse,
} from './types';

interface PlaygroundState {
    // Session state
    sessions: PlaygroundSession[];
    currentSession: PlaygroundSession | null;
    sessionsPagination: {
        page: number;
        page_size: number;
        total_pages: number;
        total_items: number;
    } | null;

    // Chat state
    chatMessages: ChatMessage[];
    isLoadingChat: boolean;

    // UI state
    isCreatingSession: boolean;
    isDeletingSession: boolean;

    // Actions
    setSessions: (sessions: PlaygroundSession[]) => void;
    setSessionsResponse: (response: GetPlaygroundSessionsResponse) => void;
    setCurrentSession: (session: PlaygroundSession | null) => void;
    addSession: (session: PlaygroundSession) => void;
    removeSession: (sessionId: string) => void;

    setChatMessages: (messages: ChatMessage[]) => void;
    setChatHistoryResponse: (response: GetChatHistoryResponse) => void;
    addChatMessage: (message: ChatMessage) => void;
    clearChatMessages: () => void;

    setIsLoadingChat: (isLoading: boolean) => void;
    setIsCreatingSession: (isCreating: boolean) => void;
    setIsDeletingSession: (isDeleting: boolean) => void;

    reset: () => void;
}

const initialState = {
    sessions: [],
    currentSession: null,
    sessionsPagination: null,
    chatMessages: [],
    isLoadingChat: false,
    isCreatingSession: false,
    isDeletingSession: false,
};

export const usePlaygroundStore = create<PlaygroundState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // Session actions
            setSessions: sessions => set({ sessions }),

            setSessionsResponse: response =>
                set({
                    sessions: response.data,
                    sessionsPagination: response.pagination,
                }),

            setCurrentSession: session => set({ currentSession: session }),

            addSession: session =>
                set(state => ({
                    sessions: [session, ...state.sessions],
                })),

            removeSession: sessionId =>
                set(state => ({
                    sessions: state.sessions.filter(
                        s => s.user_defined_session_id !== sessionId
                    ),
                    currentSession:
                        state.currentSession?.user_defined_session_id ===
                        sessionId
                            ? null
                            : state.currentSession,
                })),

            // Chat actions
            setChatMessages: messages => set({ chatMessages: messages }),

            setChatHistoryResponse: response =>
                set({
                    chatMessages: response.messages,
                }),

            addChatMessage: message =>
                set(state => ({
                    chatMessages: [...state.chatMessages, message],
                })),

            clearChatMessages: () => set({ chatMessages: [] }),

            setIsLoadingChat: isLoading => set({ isLoadingChat: isLoading }),

            setIsCreatingSession: isCreating =>
                set({ isCreatingSession: isCreating }),

            setIsDeletingSession: isDeleting =>
                set({ isDeletingSession: isDeleting }),

            // Reset all state
            reset: () => set(initialState),
        }),
        {
            name: 'playground-store',
        }
    )
);
