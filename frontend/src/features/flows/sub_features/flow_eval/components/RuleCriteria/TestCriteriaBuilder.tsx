import React, { useState } from 'react';
import RuleEditor from './RuleEditor';
import type { TestRule } from './RuleEditor';
import TestCriteriaSummary from './TestCriteriaSummary';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Logic Chain Summary (static) */}
            <div className="md:col-span-1">
                <TestCriteriaSummary
                    criteria={currentCriteria}
                    onToggleConnector={toggleConnector}
                />
            </div>

            {/* Right column - Rules list */}
            <div className="md:col-span-2 space-y-0">
                {currentCriteria.rules.map((rule, index) => (
                    <React.Fragment key={rule.id}>
                        {/* Rule without border */}
                        <div className="py-2">
                            <RuleEditor
                                rule={rule}
                                onChange={updatedRule =>
                                    updateRule(index, updatedRule)
                                }
                                onDelete={() => deleteRule(index)}
                            />
                        </div>

                        {/* Connector between rules */}
                        {index < currentCriteria.rules.length - 1 && (
                            <div className="flex items-center justify-center py-3">
                                <button
                                    type="button"
                                    onClick={() => toggleConnector(index)}
                                    className="rounded-md border px-3 py-1 text-sm font-semibold text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    {currentCriteria.connectors[index]}
                                </button>
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {/* New Rule dropdown */}
                <div className="flex justify-center pt-6">
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
