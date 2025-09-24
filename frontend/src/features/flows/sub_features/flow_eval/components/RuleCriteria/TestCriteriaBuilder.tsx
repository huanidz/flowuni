import React, { useState } from 'react';
import RuleEditor from './RuleEditor';
import type { TestRule, CriteriaWithLogicConnectors } from '../../types';
import TestCriteriaSummary from './TestCriteriaSummary';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';
import type { TestCriteriaRuleType } from '../../const';
import { create_default_rule } from '../../utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const TestCriteriaBuilder: React.FC<{
    criteria: string;
    onChange: (criteria: string) => void;
}> = ({ criteria, onChange }) => {
    const parseCriteria = (str: string): CriteriaWithLogicConnectors => {
        try {
            const parsed = str ? JSON.parse(str) : { rules: [], logics: [] };

            if (parsed.rules && parsed.logics) {
                // Format: object with rules and logics
                return {
                    rules: parsed.rules ?? [],
                    logics: parsed.logics ?? [],
                };
            } else {
                // Empty or invalid format
                return { rules: [], logics: [] };
            }
        } catch {
            return { rules: [], logics: [] };
        }
    };

    const [currentCriteria, setCurrentCriteria] =
        useState<CriteriaWithLogicConnectors>(parseCriteria(criteria));
    const [ruleSelectKey, setRuleSelectKey] = useState(0);

    // Update currentCriteria when the criteria prop changes
    React.useEffect(() => {
        setCurrentCriteria(parseCriteria(criteria));
    }, [criteria]);

    const updateCriteria = (newCriteria: CriteriaWithLogicConnectors) => {
        setCurrentCriteria(newCriteria);
        onChange(JSON.stringify(newCriteria, null, 2));
    };

    const addRule = (type: TestCriteriaRuleType) => {
        const newRule = create_default_rule(type);

        updateCriteria({
            rules: [...currentCriteria.rules, newRule],
            logics: [
                ...currentCriteria.logics,
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
        const logics = currentCriteria.logics.filter(
            (_, i) => i !== index && i !== index - 1
        );
        updateCriteria({ rules, logics });
    };

    const toggleConnector = (index: number) => {
        const logics = [...currentCriteria.logics];
        logics[index] = logics[index] === 'AND' ? 'OR' : 'AND';
        updateCriteria({ ...currentCriteria, logics });
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
                                    {currentCriteria.logics[index]}
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
