import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import {
    getLLMJudges,
    createLLMJudge,
    updateLLMJudge,
    deleteLLMJudge,
} from './api';
import type {
    LLMJudge,
    LLMJudgeListResponse,
    CreateLLMJudgeRequest,
    UpdateLLMJudgeRequest,
} from './types';
import useLLMJudgeStore from './stores';
import { useEffect } from 'react';

export const useLLMJudges = () => {
    const { setLLMJudges, setLoaded } = useLLMJudgeStore();

    const query = useQuery<LLMJudgeListResponse, Error>({
        queryKey: ['llmJudges'],
        queryFn: getLLMJudges,
    });

    useEffect(() => {
        if (query.data) {
            setLLMJudges(query.data.templates);
            setLoaded(true);
        }
    }, [query.data, setLLMJudges, setLoaded]);

    return query;
};

export const useCreateLLMJudge = () => {
    const queryClient = useQueryClient();
    const { addLLMJudge } = useLLMJudgeStore();

    return useMutation<LLMJudge, Error, CreateLLMJudgeRequest>({
        mutationFn: createLLMJudge,
        onSuccess: data => {
            addLLMJudge(data);
            queryClient.invalidateQueries({ queryKey: ['llmJudges'] });
        },
    });
};

export const useUpdateLLMJudge = () => {
    const queryClient = useQueryClient();
    const { updateLLMJudge } = useLLMJudgeStore();

    return useMutation<
        LLMJudge,
        Error,
        { templateId: number; request: UpdateLLMJudgeRequest }
    >({
        mutationFn: ({ templateId, request }) =>
            updateLLMJudge(templateId, request),
        onSuccess: data => {
            updateLLMJudge(data.id, data);
            queryClient.invalidateQueries({ queryKey: ['llmJudges'] });
        },
    });
};

export const useDeleteLLMJudge = () => {
    const queryClient = useQueryClient();
    const { removeLLMJudge } = useLLMJudgeStore();

    return useMutation<void, Error, number>({
        mutationFn: deleteLLMJudge,
        onSuccess: (_, templateId) => {
            removeLLMJudge(templateId);
            queryClient.invalidateQueries({ queryKey: ['llmJudges'] });
        },
    });
};
