import React, { useState, useMemo } from 'react';
import RuleEditor from './RuleEditor';
import type { TestRule } from './RuleEditor';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CriteriaWithConnectors = {
    rules: TestRule[];
    connectors: ('AND' | 'OR')[]; // connectors between rules
};

const TestCriteriaBuilder: React.FC<{
    criteria: string;
    onChange: (criteria: string) => void;
}> = ({ criteria, onChange }) => {
    const parseCriteria = (str: string): CriteriaWithConnectors => {
        try {
            const parsed = str
                ? JSON.parse(str)
                : { rules: [], connectors: [] };
            return {
                rules: parsed.rules ?? [],
                connectors: parsed.connectors ?? [],
            };
        } catch {
            return { rules: [], connectors: [] };
        }
    };

    const [currentCriteria, setCurrentCriteria] =
        useState<CriteriaWithConnectors>(parseCriteria(criteria));
    const [ruleSelectKey, setRuleSelectKey] = useState(0);

    const updateCriteria = (newCriteria: CriteriaWithConnectors) => {
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
                    model: '', // Will be populated when user selects from dropdown
                    prompt: '',
                    id,
                };
                break;
        }

        updateCriteria({
            rules: [...currentCriteria.rules, newRule],
            connectors: [
                ...currentCriteria.connectors,
                currentCriteria.rules.length > 0 ? 'AND' : undefined,
            ].filter(Boolean) as ('AND' | 'OR')[],
        });
        setRuleSelectKey(k => k + 1);
    };

    const updateRule = (index: number, updatedRule: TestRule) => {
        const rules = [...currentCriteria.rules];
        rules[index] = updatedRule;
        updateCriteria({ ...currentCriteria, rules });
    };

    const deleteRule = (index: number) => {
        const rules = currentCriteria.rules.filter((_, i) => i !== index);
        const connectors = currentCriteria.connectors.filter(
            (_, i) => i !== index && i !== index - 1
        );
        updateCriteria({ rules, connectors });
    };

    const toggleConnector = (index: number) => {
        const connectors = [...currentCriteria.connectors];
        connectors[index] = connectors[index] === 'AND' ? 'OR' : 'AND';
        updateCriteria({ ...currentCriteria, connectors });
    };

    // --- Summary chain
    const ruleLabel = (r: TestRule) => {
        if (r.type === 'string') return `String("${(r as any).value || ''}")`;
        if (r.type === 'regex') return `Regex(/${(r as any).pattern || ''}/)`;
        if (r.type === 'llm_judge') return `LLM(${(r as any).model || 'LLM'})`;
        return 'Rule';
    };

    const logicChain = useMemo(() => {
        const chain: string[] = [];
        currentCriteria.rules.forEach((r, i) => {
            chain.push(ruleLabel(r));
            if (i < currentCriteria.connectors.length)
                chain.push(currentCriteria.connectors[i]);
        });
        return chain;
    }, [currentCriteria]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Logic Chain Summary (static) */}
            <div className="md:col-span-1">
                <div className="sticky top-4">
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                        Logic Chain Summary
                    </h3>
                    {currentCriteria.rules.length > 0 ? (
                        <Card className="border-muted">
                            <CardContent className="py-2">
                                <div className="flex flex-wrap gap-2 items-center text-sm">
                                    {logicChain.map((token, i) =>
                                        token === 'AND' || token === 'OR' ? (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                onClick={() =>
                                                    toggleConnector(
                                                        Math.floor(i / 2)
                                                    )
                                                }
                                                className="cursor-pointer"
                                            >
                                                {token}
                                            </Badge>
                                        ) : (
                                            <Badge key={i} variant="outline">
                                                {token}
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-muted">
                            <CardContent className="py-6 text-center text-muted-foreground text-sm">
                                No rules added yet
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Right column - Rules list */}
            <div className="md:col-span-2 space-y-4">
                {currentCriteria.rules.map((rule, index) => (
                    <div key={rule.id} className="rounded-md border p-3">
                        <RuleEditor
                            rule={rule}
                            onChange={updatedRule =>
                                updateRule(index, updatedRule)
                            }
                            onDelete={() => deleteRule(index)}
                        />
                        {index < currentCriteria.rules.length - 1 && (
                            <div className="flex items-center my-2">
                                <Separator className="flex-1" />
                                <button
                                    type="button"
                                    onClick={() => toggleConnector(index)}
                                    className="mx-2 rounded-md border px-2 py-1 text-xs font-semibold text-primary hover:bg-accent hover:text-accent-foreground"
                                >
                                    {currentCriteria.connectors[index]}
                                </button>
                                <Separator className="flex-1" />
                            </div>
                        )}
                    </div>
                ))}

                {/* New Rule dropdown */}
                <div className="flex justify-center pt-2">
                    <Select
                        key={ruleSelectKey}
                        onValueChange={(
                            value: 'string' | 'regex' | 'llm_judge'
                        ) => {
                            addRule(value);
                        }}
                    >
                        <SelectTrigger className="w-[180px] text-sm">
                            <SelectValue placeholder="+ Add Rule" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="regex">Regex</SelectItem>
                            <SelectItem value="llm_judge">LLM Judge</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default TestCriteriaBuilder;
