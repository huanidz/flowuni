import React, { useState, useMemo } from 'react';
import RuleEditor from './RuleEditor';
import type { TestRule, TestCriteria } from './RuleEditor';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const TestCriteriaBuilder: React.FC<{
    criteria: string;
    onChange: (criteria: string) => void;
}> = ({ criteria, onChange }) => {
    const parseCriteria = (str: string): TestCriteria => {
        try {
            return str ? JSON.parse(str) : { rules: [], logic: 'AND' };
        } catch {
            return { rules: [], logic: 'AND' };
        }
    };

    const [currentCriteria, setCurrentCriteria] = useState<TestCriteria>(
        parseCriteria(criteria)
    );
    const [ruleSelectKey, setRuleSelectKey] = useState(0); // reset Select after choose

    const updateCriteria = (newCriteria: TestCriteria) => {
        setCurrentCriteria(newCriteria);
        onChange(JSON.stringify(newCriteria, null, 2));
    };

    const addRule = (type: 'string' | 'regex' | 'llm_judge') => {
        const id = Date.now().toString();
        let newRule: TestRule;
        switch (type) {
            case 'string':
                newRule = {
                    type: 'string',
                    operation: 'contains',
                    value: '',
                    id,
                };
                break;
            case 'regex':
                newRule = { type: 'regex', pattern: '', id };
                break;
            case 'llm_judge':
                newRule = {
                    type: 'llm_judge',
                    model: 'gpt-4',
                    temperature: 0.1,
                    prompt: '',
                    id,
                };
                break;
        }
        updateCriteria({
            ...currentCriteria,
            rules: [...currentCriteria.rules, newRule],
        });
        setRuleSelectKey(k => k + 1); // reset to "+ Add Rule"
    };

    const updateRule = (index: number, updatedRule: TestRule) => {
        const newRules = [...currentCriteria.rules];
        newRules[index] = updatedRule;
        updateCriteria({ ...currentCriteria, rules: newRules });
    };

    const deleteRule = (index: number) => {
        const newRules = currentCriteria.rules.filter((_, i) => i !== index);
        updateCriteria({ ...currentCriteria, rules: newRules });
    };

    // --- NEW: toggle logic by clicking the connector chip
    const toggleGlobalLogic = () => {
        const next = currentCriteria.logic === 'AND' ? 'OR' : 'AND';
        updateCriteria({ ...currentCriteria, logic: next });
    };

    // --- NEW: concise labels for summary panel
    const ruleLabel = (r: TestRule) => {
        if (r.type === 'string') {
            const v = (r as any).value ?? '';
            const op = (r as any).operation ?? 'contains';
            return `String(${op} "${String(v).slice(0, 12)}${String(v).length > 12 ? '…' : ''}")`;
        }
        if (r.type === 'regex') {
            const p = (r as any).pattern ?? '';
            return `Regex(/${String(p).slice(0, 12)}${String(p).length > 12 ? '…' : ''}/)`;
        }
        if (r.type === 'llm_judge') {
            const model = (r as any).model ?? 'LLM';
            return `LLM(${model})`;
        }
        return 'Rule';
    };

    const logicChain = useMemo(() => {
        const op = currentCriteria.logic;
        const parts: string[] = [];
        currentCriteria.rules.forEach((r, i) => {
            parts.push(ruleLabel(r));
            if (i < currentCriteria.rules.length - 1) parts.push(op);
        });
        return parts;
    }, [currentCriteria]);

    return (
        <div className="space-y-6">
            {/* Summary panel */}
            {currentCriteria.rules.length > 0 && (
                <Card className="border-muted">
                    <CardHeader className="py-3">
                        <CardTitle className="text-base">
                            Logic summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ScrollArea className="w-full">
                            <div className="flex flex-wrap gap-2 items-center">
                                {logicChain.map((token, i) =>
                                    token === 'AND' || token === 'OR' ? (
                                        <Badge
                                            key={`op-${i}`}
                                            variant="secondary"
                                            // also toggles here for convenience
                                            onClick={toggleGlobalLogic}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e =>
                                                (e.key === 'Enter' ||
                                                    e.key === ' ') &&
                                                toggleGlobalLogic()
                                            }
                                            className="cursor-pointer"
                                            title="Click to toggle AND/OR"
                                        >
                                            {token}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            key={`rule-${i}`}
                                            variant="outline"
                                        >
                                            {token}
                                        </Badge>
                                    )
                                )}
                            </div>
                            {currentCriteria.rules.length > 1 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Tip: Click any{' '}
                                    <span className="font-medium">AND/OR</span>{' '}
                                    badge (or the connector between rules) to
                                    toggle. Applies to all connectors.
                                </p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {currentCriteria.rules.map((rule, index) => (
                <div
                    key={rule.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                    <RuleEditor
                        rule={rule}
                        onChange={updatedRule => updateRule(index, updatedRule)}
                        onDelete={() => deleteRule(index)}
                    />
                    {index < currentCriteria.rules.length - 1 && (
                        <div className="flex items-center my-4">
                            <Separator className="flex-1" />
                            {/* Clickable logic chip between rules */}
                            <button
                                type="button"
                                onClick={toggleGlobalLogic}
                                onKeyDown={e =>
                                    (e.key === 'Enter' || e.key === ' ') &&
                                    toggleGlobalLogic()
                                }
                                className="mx-3 rounded-md border px-3 py-1 text-sm font-semibold text-primary hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                                aria-label={`Toggle logic (currently ${currentCriteria.logic})`}
                                title="Click to toggle AND/OR"
                            >
                                {currentCriteria.logic}
                            </button>
                            <Separator className="flex-1" />
                        </div>
                    )}
                </div>
            ))}

            {/* Centered New Rule dropdown (resets after choose) */}
            <div className="flex justify-center">
                <Select
                    key={ruleSelectKey}
                    onValueChange={(value: 'string' | 'regex' | 'llm_judge') =>
                        addRule(value)
                    }
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="+ Add Rule" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="string">String Rule</SelectItem>
                        <SelectItem value="regex">Regex Rule</SelectItem>
                        <SelectItem value="llm_judge">LLM Judge</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default TestCriteriaBuilder;
