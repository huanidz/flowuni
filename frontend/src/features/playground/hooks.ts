import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createPlaygroundSession,
    deletePlaygroundSession,
    addChatMessage,
    getChatHistory,
    getSessionsWithLastMessage,
} from './api';
import type {
    CreatePlaygroundSessionRequest,
    GetPlaygroundSessionsRequest,
    AddChatMessageRequest,
} from './types';

// Session hooks
export const useCreatePlaygroundSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreatePlaygroundSessionRequest) =>
            createPlaygroundSession(request),
        onSuccess: (data, variables) => {
            // Invalidate playground sessions query for the specific flow
            queryClient.invalidateQueries({
                queryKey: ['playground-sessions', variables.flow_id],
            });
            // Invalidate sessions with last message query for the specific flow
            queryClient.invalidateQueries({
                queryKey: ['sessions-with-last-message', variables.flow_id],
            });
        },
    });
};

export const useDeletePlaygroundSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => deletePlaygroundSession(sessionId),
        onSuccess: (_, sessionId) => {
            // Invalidate all playground sessions queries
            queryClient.invalidateQueries({
                queryKey: ['sessions-with-last-message'],
            });
            // Remove the specific session from cache
            queryClient.removeQueries({
                queryKey: ['sessions-with-last-message', sessionId],
            });
        },
    });
};

// Chat hooks
export const useAddChatMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: AddChatMessageRequest) => addChatMessage(request),
        onSuccess: (data, variables) => {
            // Invalidate chat history for the session
            queryClient.invalidateQueries({
                queryKey: ['chat-history', variables.session_id],
            });
        },
    });
};

export const useChatHistory = (sessionId: string, numMessages?: number) => {
    return useQuery({
        queryKey: ['chat-history', sessionId, numMessages],
        queryFn: () => getChatHistory(sessionId, numMessages),
        enabled: !!sessionId,
    });
};

// Sessions with last message hook
export const useSessionsWithLastMessage = (
    request: GetPlaygroundSessionsRequest
) => {
    return useQuery({
        queryKey: [
            'sessions-with-last-message',
            request.flow_id,
            request.page,
            request.per_page,
        ],
        queryFn: () => getSessionsWithLastMessage(request),
        enabled: !!request.flow_id,
    });
};
