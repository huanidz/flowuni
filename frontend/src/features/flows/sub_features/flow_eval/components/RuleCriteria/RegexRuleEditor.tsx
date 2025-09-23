import React from 'react';
import { Button } from '@/components/ui/button';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';

export interface RegexRuleConfig {
    pattern: string;
    flags?: string[];
}

export interface RegexRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.REGEX;
    config: RegexRuleConfig;
    id: number;
}

interface RegexRuleEditorProps {
    rule: RegexRule;
    onChange: (rule: RegexRule) => void;
    onDelete: () => void;
}

const RegexRuleEditor: React.FC<RegexRuleEditorProps> = ({
    rule,
    onChange,
    onDelete,
}) => {
    // Define color theme for regex rule
    const theme = {
        container:
            'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
        label: 'text-green-700 dark:text-green-300',
    };

    return (
        <div className={`border rounded-lg p-3 ${theme.container}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${theme.label}`}>
                    Regex
                </span>
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
                    value={rule.config?.pattern || ''}
                    onChange={e =>
                        onChange({
                            ...rule,
                            config: {
                                ...rule.config,
                                pattern: e.target.value,
                            },
                        })
                    }
                    placeholder="Pattern (e.g., ^[0-9]+$)"
                    className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 font-mono"
                />
                <input
                    type="text"
                    value={rule.config?.flags?.join(',') || ''}
                    onChange={e =>
                        onChange({
                            ...rule,
                            config: {
                                ...rule.config,
                                flags: e.target.value
                                    ? e.target.value.split(',')
                                    : undefined,
                            },
                        })
                    }
                    placeholder="Flags"
                    className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900 font-mono"
                />
            </div>
        </div>
    );
};

export default RegexRuleEditor;
