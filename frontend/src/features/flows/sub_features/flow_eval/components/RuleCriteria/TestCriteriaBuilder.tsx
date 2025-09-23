import React, { useState } from 'react';
import RuleEditor from './RuleEditor';
import type { TestRule } from '../../types';
import TestCriteriaSummary from './TestCriteriaSummary';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';
import type { TestCriteriaRuleType } from '../../const';

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
            // If the criteria is an object with rules and logics (new format)
            // If it's an object with rules and connectors (old format), use it directly for backward compatibility
            const parsed = str
                ? JSON.parse(str)
                : { rules: [], connectors: [] };

            if (parsed.rules && parsed.logics) {
                // New format: object with rules and logics
                return {
                    rules: parsed.rules ?? [],
                    connectors: parsed.logics ?? [],
                };
            } else if (parsed.rules && parsed.connectors) {
                // Old format: object with rules and connectors
                return {
                    rules: parsed.rules ?? [],
                    connectors: parsed.connectors ?? [],
                };
            } else {
                // Empty or invalid format
                return { rules: [], connectors: [] };
            }
        } catch {
            return { rules: [], connectors: [] };
        }
    };

    const [currentCriteria, setCurrentCriteria] =
        useState<CriteriaWithConnectors>(parseCriteria(criteria));
    const [ruleSelectKey, setRuleSelectKey] = useState(0);

    const updateCriteria = (newCriteria: CriteriaWithConnectors) => {
        setCurrentCriteria(newCriteria);

        // Convert to the expected format: object with rules and logics
        const passCriteria = {
            rules: newCriteria.rules,
            logics: newCriteria.connectors,
        };

        onChange(JSON.stringify(passCriteria, null, 2));
    };

    const addRule = (type: TestCriteriaRuleType) => {
        const id = Date.now(); // Use number instead of string
        let newRule: TestRule;
        switch (type) {
            case TEST_CRITERIA_RULE_TYPES.STRING:
                newRule = {
                    type: TEST_CRITERIA_RULE_TYPES.STRING,
                    config: {
                        operation: 'contains',
                        value: '',
                    },
                    id,
                };
                break;
            case TEST_CRITERIA_RULE_TYPES.REGEX:
                newRule = {
                    type: TEST_CRITERIA_RULE_TYPES.REGEX,
                    config: {
                        pattern: '',
                    },
                    id,
                };
                break;
            case TEST_CRITERIA_RULE_TYPES.LLM_JUDGE:
                newRule = {
                    type: TEST_CRITERIA_RULE_TYPES.LLM_JUDGE,
                    config: {
                        data: {
                            provider: '',
                            model: '',
                            api_key: '',
                        },
                    },
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
                <div className="text-xs text-gray-500 mb-2">
                    All criteria must pass for test to pass
                </div>
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
                        onValueChange={(value: TestCriteriaRuleType) => {
                            addRule(value);
                        }}
                    >
                        <SelectTrigger className="w-[180px] text-sm">
                            <SelectValue placeholder="+ Add Rule" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TEST_CRITERIA_RULE_TYPES.STRING}>
                                String
                            </SelectItem>
                            <SelectItem value={TEST_CRITERIA_RULE_TYPES.REGEX}>
                                Regex
                            </SelectItem>
                            <SelectItem
                                value={TEST_CRITERIA_RULE_TYPES.LLM_JUDGE}
                            >
                                LLM Judge
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default TestCriteriaBuilder;
