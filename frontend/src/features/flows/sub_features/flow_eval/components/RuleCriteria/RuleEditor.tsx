import React, { useState, useEffect, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types for the rule builder
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

// Component for individual rule editing
const RuleEditor: React.FC<{
    rule: TestRule;
    onChange: (rule: TestRule) => void;
    onDelete: () => void;
}> = ({ rule, onChange, onDelete }) => {
    if (rule.type === 'string') {
        return (
            <Card className="bg-slate-50 dark:bg-slate-800/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center justify-between">
                        <span>Rule {rule.id}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                            ×
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select value="string" disabled>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={rule.operation}
                            onValueChange={value =>
                                onChange({
                                    ...rule,
                                    operation: value as StringRule['operation'],
                                })
                            }
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contains">
                                    contains
                                </SelectItem>
                                <SelectItem value="equals">equals</SelectItem>
                                <SelectItem value="starts_with">
                                    starts with
                                </SelectItem>
                                <SelectItem value="ends_with">
                                    ends with
                                </SelectItem>
                                <SelectItem value="not_contains">
                                    does not contain
                                </SelectItem>
                                <SelectItem value="length_gt">
                                    length greater than
                                </SelectItem>
                                <SelectItem value="length_lt">
                                    length less than
                                </SelectItem>
                                <SelectItem value="length_eq">
                                    length equals
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <input
                            type="text"
                            value={rule.value}
                            onChange={e =>
                                onChange({ ...rule, value: e.target.value })
                            }
                            placeholder="Value"
                            className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 min-w-[120px]"
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (rule.type === 'regex') {
        return (
            <Card className="bg-blue-50 dark:bg-blue-900/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center justify-between">
                        <span>Rule {rule.id}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                            ×
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select value="regex" disabled>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="regex">Regex</SelectItem>
                            </SelectContent>
                        </Select>
                        <input
                            type="text"
                            value={rule.pattern}
                            onChange={e =>
                                onChange({ ...rule, pattern: e.target.value })
                            }
                            placeholder="Pattern (e.g., ^[0-9]+$)"
                            className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 font-mono min-w-[200px]"
                        />
                        <input
                            type="text"
                            value={rule.flags || ''}
                            onChange={e =>
                                onChange({ ...rule, flags: e.target.value })
                            }
                            placeholder="Flags (i, g, m)"
                            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 font-mono w-20"
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (rule.type === 'llm_judge') {
        const [llmJudges, setLlmJudges] = useState<LLMJudge[]>([]);
        const [isLoading, setIsLoading] = useState(false);
        const [reloadKey, setReloadKey] = useState(0);

        const fetchLlmJudges = useCallback(async () => {
            setIsLoading(true);
            try {
                const response = await getLLMJudges();
                setLlmJudges(response.templates);
            } catch (error) {
                console.error('Failed to fetch LLM judges:', error);
            } finally {
                setIsLoading(false);
            }
        }, []);

        useEffect(() => {
            fetchLlmJudges();
        }, [fetchLlmJudges, reloadKey]);

        const handleReload = () => {
            setReloadKey(prev => prev + 1);
        };

        return (
            <Card className="bg-purple-50 dark:bg-purple-900/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center justify-between">
                        <span>LLM Judge</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                            ×
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-20">
                            Model:
                        </span>
                        <Select
                            value={rule.model}
                            onValueChange={value =>
                                onChange({ ...rule, model: value })
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a judge" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="py-2 px-3 text-sm text-slate-500">
                                        Loading...
                                    </div>
                                ) : llmJudges.length > 0 ? (
                                    llmJudges.map(judge => (
                                        <SelectItem
                                            key={judge.id}
                                            value={judge.id.toString()}
                                        >
                                            {judge.name
                                                ? `${judge.name} (ID: ${judge.id})`
                                                : `Judge ${judge.id}`}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="py-2 px-3 text-sm text-slate-500">
                                        No judges available
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
                    <div>
                        <Textarea
                            value={rule.prompt}
                            onChange={e =>
                                onChange({ ...rule, prompt: e.target.value })
                            }
                            placeholder="Enter the prompt to evaluate the test output..."
                            className="min-h-20"
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
};

export default RuleEditor;
