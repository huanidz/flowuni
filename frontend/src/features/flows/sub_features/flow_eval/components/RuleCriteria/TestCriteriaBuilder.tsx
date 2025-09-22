import React, { useState } from 'react';
import RuleEditor from './RuleEditor';
import type {
    TestRule,
    TestCriteria,
    StringRule,
    RegexRule,
    LLMRule,
} from './RuleEditor';

// Main criteria builder component
const TestCriteriaBuilder: React.FC<{
    criteria: string;
    onChange: (criteria: string) => void;
}> = ({ criteria, onChange }) => {
    // Parse criteria from string (JSON) or initialize empty
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

    return (
        <div className="space-y-3">
            {currentCriteria.rules.map((rule, index) => (
                <div key={rule.id}>
                    <RuleEditor
                        rule={rule}
                        onChange={updatedRule => updateRule(index, updatedRule)}
                        onDelete={() => deleteRule(index)}
                    />
                    {index < currentCriteria.rules.length - 1 && (
                        <div className="text-center py-2">
                            <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded text-sm font-medium text-slate-600 dark:text-slate-400">
                                {currentCriteria.logic}
                            </span>
                        </div>
                    )}
                </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            onChange={e => {
                                const type = e.target.value as
                                    | 'string'
                                    | 'regex'
                                    | 'llm_judge';
                                if (type) {
                                    addRule(type);
                                    e.target.value = '';
                                }
                            }}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                            defaultValue=""
                        >
                            <option value="">+ Add Rule</option>
                            <option value="string">String Rule</option>
                            <option value="regex">Regex Rule</option>
                            <option value="llm_judge">LLM Judge</option>
                        </select>
                    </div>
                </div>

                {currentCriteria.rules.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Logic:
                        </span>
                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                name="logic"
                                value="AND"
                                checked={currentCriteria.logic === 'AND'}
                                onChange={e =>
                                    updateCriteria({
                                        ...currentCriteria,
                                        logic: e.target.value as 'AND' | 'OR',
                                    })
                                }
                            />
                            <span className="text-sm">AND</span>
                        </label>
                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                name="logic"
                                value="OR"
                                checked={currentCriteria.logic === 'OR'}
                                onChange={e =>
                                    updateCriteria({
                                        ...currentCriteria,
                                        logic: e.target.value as 'AND' | 'OR',
                                    })
                                }
                            />
                            <span className="text-sm">OR</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestCriteriaBuilder;
