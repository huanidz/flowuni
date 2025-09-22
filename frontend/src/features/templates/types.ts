export interface LLMProviderParser {
    provider: string;
    model: string;
    api_key: string;
    system_prompt?: string;
    temperature?: number;
    max_output_tokens?: number;
}

export interface LLMJudge {
    id: number;
    user_id: number;
    type: string;
    name?: string;
    description?: string;
    data?: LLMProviderParser;
    created_at: string;
    modified_at: string;
}

export interface LLMJudgeListResponse {
    templates: LLMJudge[];
}

export interface CreateLLMJudgeRequest {
    name?: string;
    description?: string;
    data?: LLMProviderParser;
}

export interface UpdateLLMJudgeRequest {
    name?: string;
    description?: string;
    data?: LLMProviderParser;
}
