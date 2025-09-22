export interface LLMProviderParser {
    provider: string;
    model: string;
    api_key: string;
    system_prompt?: string;
    temperature?: number;
    max_output_tokens?: number;
}

export interface LLMJudgeParser {
    judge_name: string;
    judge_description?: string;
    judge_llm_provider: LLMProviderParser;
}

export interface LLMJudge {
    id: number;
    user_id: number;
    type: string;
    name?: string;
    description?: string;
    judge_config?: LLMJudgeParser;
    created_at: string;
    updated_at: string;
}

export interface LLMJudgeListResponse {
    templates: LLMJudge[];
}

export interface CreateLLMJudgeRequest {
    name?: string;
    description?: string;
    judge_config?: LLMJudgeParser;
}

export interface UpdateLLMJudgeRequest {
    name?: string;
    description?: string;
    judge_config?: LLMJudgeParser;
}
