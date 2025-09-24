import React, { useState, useEffect } from 'react';
import { getLLMJudges } from '@/features/templates/api';
import type { LLMJudge } from '@/features/templates/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { LLMRule } from '../../types';

interface LLMRuleEditorProps {
    rule: LLMRule;
    onChange: (rule: LLMRule) => void;
    onDelete: () => void;
}

const LLMRuleEditor: React.FC<LLMRuleEditorProps> = ({
    rule,
    onChange,
    onDelete,
}) => {
    const [llmJudges, setLlmJudges] = useState<LLMJudge[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    console.log('Rule: ', rule);

    const fetchLlmJudges = async () => {
        setIsLoading(true);
        try {
            const response = await getLLMJudges();
            console.log('response.templates:', response.templates);
            /**
             * SAMPLE json:
             * response.templates = [
                    {
                        "id": 1,
                        "user_id": 1,
                        "type": "llm_judge",
                        "name": "Judge name",
                        "description": "qwe",
                        "data": {
                            "provider": "e",
                            "model": "e",
                            "api_key": "e",
                            "system_prompt": "e",
                            "temperature": 0,
                            "max_output_tokens": 1024
                        },
                        "created_at": "2025-09-24T03:40:55.920212",
                        "modified_at": "2025-09-24T03:40:55.920216"
                    }
                ]
             * 
             */
            setLlmJudges(response.templates);
        } catch (error) {
            console.error('Failed to fetch LLM judges:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLlmJudges();
    }, []);

    const handleReload = () => {
        fetchLlmJudges();
    };

    // Define color theme for LLM rule
    const theme = {
        container:
            'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20',
        label: 'text-purple-700 dark:text-purple-300',
    };

    return (
        <div className={`border rounded-lg p-3 ${theme.container}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${theme.label}`}>
                    LLM Judge
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                    ×
                </Button>
            </div>
            <div className="space-y-3">
                <div className="flex gap-2">
                    <Select
                        value={rule.config?.judge_id?.toString() || ''}
                        onValueChange={value => {
                            const selectedJudge = llmJudges.find(
                                judge => judge.id.toString() === value
                            );
                            if (selectedJudge && selectedJudge.data) {
                                onChange({
                                    ...rule,
                                    config: {
                                        judge_id: selectedJudge.id,
                                        name: selectedJudge.name,
                                        description: selectedJudge.description,
                                        llm_provider: {
                                            provider:
                                                selectedJudge.data.provider,
                                            model: selectedJudge.data.model,
                                            api_key: selectedJudge.data.api_key,
                                            system_prompt:
                                                selectedJudge.data
                                                    .system_prompt,
                                            temperature:
                                                selectedJudge.data.temperature,
                                            max_output_tokens:
                                                selectedJudge.data
                                                    .max_output_tokens,
                                        },
                                        instruction:
                                            rule.config?.instruction || '',
                                    },
                                });
                            }
                        }}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="flex-1 h-8">
                            <SelectValue placeholder="Select LLM judge" />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoading ? (
                                <div className="py-1 px-3 text-sm text-slate-500">
                                    Loading...
                                </div>
                            ) : llmJudges.length > 0 ? (
                                llmJudges.map(judge => (
                                    <SelectItem
                                        key={judge.id}
                                        value={judge.id.toString()}
                                    >
                                        {judge.name || `Judge ${judge.id}`}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="py-1 px-3 text-sm text-slate-500">
                                    No LLM judges available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReload}
                        disabled={isLoading}
                        className="p-1 h-8 w-8"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                        />
                    </Button>
                </div>
                <Textarea
                    value={rule.config?.instruction || ''}
                    onChange={e =>
                        onChange({
                            ...rule,
                            config: {
                                ...rule.config,
                                instruction: e.target.value,
                            },
                        })
                    }
                    placeholder="Enter instruction for LLM judge evaluation..."
                    className="min-h-16 text-sm"
                />
            </div>
        </div>
    );
};

export default LLMRuleEditor;
