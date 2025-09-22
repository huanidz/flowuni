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

export interface StringRule {
    type: 'string';
    operation:
        | 'contains'
        | 'equals'
        | 'starts_with'
        | 'ends_with'
        | 'not_contains'
        | 'length_gt'
        | 'length_lt'
        | 'length_eq';
    value: string;
    id: string;
}

export interface RegexRule {
    type: 'regex';
    pattern: string;
    flags?: string;
    id: string;
}

export interface LLMRule {
    type: 'llm_judge';
    model: string;
    prompt: string;
    id: string;
}

export type TestRule = StringRule | RegexRule | LLMRule;

export interface TestCriteria {
    rules: TestRule[];
    logic: 'AND' | 'OR';
}

const RuleEditor: React.FC<{
    rule: TestRule;
    onChange: (rule: TestRule) => void;
    onDelete: () => void;
}> = ({ rule, onChange, onDelete }) => {
    if (rule.type === 'string') {
        return (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">String</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                        ×
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Select
                        value={rule.operation}
                        onValueChange={value =>
                            onChange({
                                ...rule,
                                operation: value as StringRule['operation'],
                            })
                        }
                    >
                        <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="contains">contains</SelectItem>
                            <SelectItem value="equals">equals</SelectItem>
                            <SelectItem value="starts_with">
                                starts with
                            </SelectItem>
                            <SelectItem value="ends_with">ends with</SelectItem>
                            <SelectItem value="not_contains">
                                does not contain
                            </SelectItem>
                            <SelectItem value="length_gt">
                                length &gt;
                            </SelectItem>
                            <SelectItem value="length_lt">
                                length &lt;
                            </SelectItem>
                            <SelectItem value="length_eq">length =</SelectItem>
                        </SelectContent>
                    </Select>
                    <input
                        type="text"
                        value={rule.value}
                        onChange={e =>
                            onChange({ ...rule, value: e.target.value })
                        }
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                    />
                </div>
            </div>
        );
    }

    if (rule.type === 'regex') {
        return (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Regex</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                        ×
                    </Button>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={rule.pattern}
                        onChange={e =>
                            onChange({ ...rule, pattern: e.target.value })
                        }
                        placeholder="Pattern (e.g., ^[0-9]+$)"
                        className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 font-mono"
                    />
                    <input
                        type="text"
                        value={rule.flags || ''}
                        onChange={e =>
                            onChange({ ...rule, flags: e.target.value })
                        }
                        placeholder="Flags"
                        className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 font-mono"
                    />
                </div>
            </div>
        );
    }

    if (rule.type === 'llm_judge') {
        const [llmJudges, setLlmJudges] = useState<LLMJudge[]>([]);
        const [isLoading, setIsLoading] = useState(false);

        const fetchLlmJudges = async () => {
            setIsLoading(true);
            try {
                const response = await getLLMJudges();
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

        return (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">LLM Judge</span>
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
                            value={rule.model}
                            onValueChange={value =>
                                onChange({ ...rule, model: value })
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger className="flex-1 h-8">
                                <SelectValue placeholder="Select judge" />
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
                                        No judges
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
                        value={rule.prompt}
                        onChange={e =>
                            onChange({ ...rule, prompt: e.target.value })
                        }
                        placeholder="Prompt to evaluate test output..."
                        className="min-h-16 text-sm"
                    />
                </div>
            </div>
        );
    }

    return null;
};

export default RuleEditor;
