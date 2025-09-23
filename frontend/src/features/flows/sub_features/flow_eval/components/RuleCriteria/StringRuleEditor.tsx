import React from 'react';
import { Button } from '@/components/ui/button';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';

export interface StringRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.STRING;
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

interface StringRuleEditorProps {
    rule: StringRule;
    onChange: (rule: StringRule) => void;
    onDelete: () => void;
}

const StringRuleEditor: React.FC<StringRuleEditorProps> = ({
    rule,
    onChange,
    onDelete,
}) => {
    // Define color theme for string rule
    const theme = {
        container:
            'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
        label: 'text-blue-700 dark:text-blue-300',
    };

    return (
        <div className={`border rounded-lg p-3 ${theme.container}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${theme.label}`}>
                    String
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
                <Select
                    value={rule.operation}
                    onValueChange={value =>
                        onChange({
                            ...rule,
                            operation: value as StringRule['operation'],
                        })
                    }
                >
                    <SelectTrigger className="w-36 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="starts_with">starts with</SelectItem>
                        <SelectItem value="ends_with">ends with</SelectItem>
                        <SelectItem value="not_contains">
                            does not contain
                        </SelectItem>
                        <SelectItem value="length_gt">length {'>'}</SelectItem>
                        <SelectItem value="length_lt">length {'<'}</SelectItem>
                        <SelectItem value="length_eq">length =</SelectItem>
                    </SelectContent>
                </Select>
                <input
                    type="text"
                    value={rule.value}
                    onChange={e => onChange({ ...rule, value: e.target.value })}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-900"
                />
            </div>
        </div>
    );
};

export default StringRuleEditor;
