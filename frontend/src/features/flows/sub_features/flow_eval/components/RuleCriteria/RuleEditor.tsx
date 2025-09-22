import React from 'react';

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
    temperature: number;
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

export default RuleEditor;
