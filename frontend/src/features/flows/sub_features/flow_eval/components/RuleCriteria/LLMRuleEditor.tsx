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
    const [judges, setJudges] = useState<LLMJudge[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchJudges = async () => {
        setLoading(true);
        try {
            const response = await getLLMJudges();
            setJudges(response.templates || []);
        } catch (error) {
            console.error('Failed to fetch LLM judges:', error);
            setJudges([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJudges();
    }, []);

    const handleJudgeSelect = (value: string) => {
        const judge = judges.find(j => j.id.toString() === value);
        if (!judge?.data) return;

        onChange({
            ...rule,
            config: {
                ...rule.config,
                judge_id: judge.id,
                name: judge.name,
                description: judge.description,
                llm_provider: {
                    provider: judge.data.provider,
                    model: judge.data.model,
                    api_key: judge.data.api_key,
                    system_prompt: judge.data.system_prompt,
                    temperature: judge.data.temperature,
                    max_output_tokens: judge.data.max_output_tokens,
                },
                instruction: rule.config?.instruction || '',
            },
        });
    };

    const handleInstructionChange = (instruction: string) => {
        onChange({
            ...rule,
            config: {
                ...rule.config,
                instruction,
            },
        });
    };

    return (
        <div className="border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
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

            {/* Content */}
            <div className="space-y-3">
                {/* Judge Selection */}
                <div className="flex gap-2">
                    <Select
                        value={rule.config?.judge_id?.toString() || ''}
                        onValueChange={handleJudgeSelect}
                        disabled={loading}
                    >
                        <SelectTrigger className="flex-1 h-8">
                            <SelectValue placeholder="Select LLM judge" />
                        </SelectTrigger>
                        <SelectContent>
                            {loading ? (
                                <div className="py-1 px-3 text-sm text-slate-500">
                                    Loading...
                                </div>
                            ) : judges.length > 0 ? (
                                judges.map(judge => (
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
                        onClick={fetchJudges}
                        disabled={loading}
                        className="p-1 h-8 w-8"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                        />
                    </Button>
                </div>

                {/* Instruction Input */}
                <Textarea
                    value={rule.config?.instruction || ''}
                    onChange={e => handleInstructionChange(e.target.value)}
                    placeholder="Enter instruction for LLM judge evaluation..."
                    className="min-h-16 text-sm"
                />
            </div>
        </div>
    );
};

export default LLMRuleEditor;
