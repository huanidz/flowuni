import apiClient from '@/api/secureClient';
import { LLM_JUDGES_ENDPOINT, LLM_CONFIG_ENDPOINT } from './consts';
import type {
    LLMJudge,
    LLMJudgeListResponse,
    CreateLLMJudgeRequest,
    UpdateLLMJudgeRequest,
    LLMSupportConfig,
} from './types';

export const getLLMJudges = async (): Promise<LLMJudgeListResponse> => {
    const { data } = await apiClient.get(LLM_JUDGES_ENDPOINT);
    return data;
};

export const createLLMJudge = async (
    request: CreateLLMJudgeRequest
): Promise<LLMJudge> => {
    const { data } = await apiClient.post(LLM_JUDGES_ENDPOINT, request);
    return data;
};

export const updateLLMJudge = async (
    templateId: number,
    request: UpdateLLMJudgeRequest
): Promise<LLMJudge> => {
    const { data } = await apiClient.put(
        `${LLM_JUDGES_ENDPOINT}/${templateId}`,
        request
    );
    return data;
};

export const deleteLLMJudge = async (templateId: number): Promise<void> => {
    await apiClient.delete(`${LLM_JUDGES_ENDPOINT}/${templateId}`);
};

export const getLLMConfig = async (): Promise<LLMSupportConfig> => {
    const { data } = await apiClient.get(LLM_CONFIG_ENDPOINT);
    return data;
};
