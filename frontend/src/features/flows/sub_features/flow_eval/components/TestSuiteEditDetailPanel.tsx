import React, { useState } from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';

// Types for the rule builder
interface StringRule {
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

interface RegexRule {
    type: 'regex';
    pattern: string;
    flags?: string;
    id: string;
}

interface LLMRule {
    type: 'llm_judge';
    model: string;
    temperature: number;
    prompt: string;
    id: string;
}

type TestRule = StringRule | RegexRule | LLMRule;

interface TestCriteria {
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
            <div className="border border-slate-300 dark:border-slate-600 rounded-md p-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Rule {rule.id}
                    </span>
                    <button
                        onClick={onDelete}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                    >
                        ×
                    </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value="string"
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                        disabled
                    >
                        <option value="string">String</option>
                    </select>
                    <select
                        value={rule.operation}
                        onChange={e =>
                            onChange({
                                ...rule,
                                operation: e.target
                                    .value as StringRule['operation'],
                            })
                        }
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                    >
                        <option value="contains">contains</option>
                        <option value="equals">equals</option>
                        <option value="starts_with">starts with</option>
                        <option value="ends_with">ends with</option>
                        <option value="not_contains">does not contain</option>
                        <option value="length_gt">length greater than</option>
                        <option value="length_lt">length less than</option>
                        <option value="length_eq">length equals</option>
                    </select>
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
            </div>
        );
    }

    if (rule.type === 'regex') {
        return (
            <div className="border border-slate-300 dark:border-slate-600 rounded-md p-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Rule {rule.id}
                    </span>
                    <button
                        onClick={onDelete}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                    >
                        ×
                    </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value="regex"
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                        disabled
                    >
                        <option value="regex">Regex</option>
                    </select>
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
            </div>
        );
    }

    if (rule.type === 'llm_judge') {
        return (
            <div className="border border-slate-300 dark:border-slate-600 rounded-md p-3 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        LLM Judge
                    </span>
                    <button
                        onClick={onDelete}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                    >
                        ×
                    </button>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-20">
                            Model:
                        </span>
                        <select
                            value={rule.model}
                            onChange={e =>
                                onChange({ ...rule, model: e.target.value })
                            }
                            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                        >
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="claude-3-sonnet">
                                Claude 3 Sonnet
                            </option>
                            <option value="claude-3-haiku">
                                Claude 3 Haiku
                            </option>
                        </select>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Temperature:
                        </span>
                        <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={rule.temperature}
                            onChange={e =>
                                onChange({
                                    ...rule,
                                    temperature:
                                        parseFloat(e.target.value) || 0,
                                })
                            }
                            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 w-16"
                        />
                    </div>
                    <div>
                        <textarea
                            value={rule.prompt}
                            onChange={e =>
                                onChange({ ...rule, prompt: e.target.value })
                            }
                            placeholder="Enter the prompt to evaluate the test output..."
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 h-20 resize-none"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

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

interface TestSuiteEditDetailPanelProps {
    selectedTestCase: FlowTestCase | null;
    onUpdateTestCase?: (testCase: FlowTestCase) => void;
}

/**
 * Right panel component for displaying test case details in TestSuiteEdit modal
 */
const TestSuiteEditDetailPanel: React.FC<TestSuiteEditDetailPanelProps> = ({
    selectedTestCase,
    onUpdateTestCase,
}) => {
    const [description, setDescription] = useState(
        selectedTestCase?.description || ''
    );
    const [input, setInput] = useState(selectedTestCase?.input || '');
    const [expectedOutput, setExpectedOutput] = useState(
        selectedTestCase?.expected_output || ''
    );
    const [testCriteria, setTestCriteria] = useState(
        selectedTestCase?.test_criteria || ''
    );

    // Update local state when selectedTestCase changes
    React.useEffect(() => {
        setDescription(selectedTestCase?.description || '');
        setInput(selectedTestCase?.input || '');
        setExpectedOutput(selectedTestCase?.expected_output || '');
        setTestCriteria(selectedTestCase?.test_criteria || '');
    }, [selectedTestCase]);

    const handleFieldChange = (field: string, value: string) => {
        if (selectedTestCase && onUpdateTestCase) {
            onUpdateTestCase({ ...selectedTestCase, [field]: value });
        }
    };

    if (!selectedTestCase) {
        return (
            <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No Test Case Selected
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Select a test case from the list to view its details.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full md:w-2/3 overflow-y-auto bg-white dark:bg-slate-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        ID: {selectedTestCase.case_id}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {selectedTestCase.name}
                    </h3>
                </div>
                {getStatusBadge(
                    selectedTestCase.status || TestCaseStatus.PENDING
                )}
            </div>

            {/* Two-Column Layout for Input and Expected Output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        INPUT
                    </label>
                    <textarea
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            handleFieldChange('input', e.target.value);
                        }}
                        placeholder="Enter test input..."
                        className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none"
                    />
                </div>

                {/* Expected Output */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        EXPECTED OUTPUT
                    </label>
                    <textarea
                        value={expectedOutput}
                        onChange={e => {
                            setExpectedOutput(e.target.value);
                            handleFieldChange(
                                'expected_output',
                                e.target.value
                            );
                        }}
                        placeholder="Enter expected output..."
                        className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none"
                    />
                </div>
            </div>

            {/* Test Pass Criteria - Rule Builder */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TEST PASS CRITERIA
                </label>
                <TestCriteriaBuilder
                    criteria={testCriteria}
                    onChange={criteria => {
                        setTestCriteria(criteria);
                        handleFieldChange('test_criteria', criteria);
                    }}
                />
            </div>

            {/* Bottom Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <span>Description:</span>
                    <input
                        type="text"
                        value={description}
                        onChange={e => {
                            setDescription(e.target.value);
                            handleFieldChange('description', e.target.value);
                        }}
                        placeholder="Optional description"
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm w-48"
                    />
                </div>

                {selectedTestCase.execution_time_ms && (
                    <div>
                        <span>Execution Time: </span>
                        <span className="font-mono">
                            {selectedTestCase.execution_time_ms}ms
                        </span>
                    </div>
                )}

                {selectedTestCase.error_message && (
                    <div className="flex-1">
                        <span className="text-red-600 dark:text-red-400">
                            Error:{' '}
                        </span>
                        <span className="font-mono text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            {selectedTestCase.error_message}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSuiteEditDetailPanel;
