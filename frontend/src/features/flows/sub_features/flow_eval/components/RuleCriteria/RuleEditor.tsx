import React from 'react';
import StringRuleEditor from './StringRuleEditor';
import RegexRuleEditor from './RegexRuleEditor';
import LLMRuleEditor from './LLMRuleEditor';

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
    prompt: string;
    id: string;
}

export type TestRule = StringRule | RegexRule | LLMRule;

export interface TestCriteria {
    rules: TestRule[];
    logic: 'AND' | 'OR';
}

const RuleEditor: React.FC<{
    rule: TestRule;
    onChange: (rule: TestRule) => void;
    onDelete: () => void;
}> = ({ rule, onChange, onDelete }) => {
    if (rule.type === 'string') {
        return (
            <StringRuleEditor
                rule={rule}
                onChange={onChange}
                onDelete={onDelete}
            />
        );
    }

    if (rule.type === 'regex') {
        return (
            <RegexRuleEditor
                rule={rule}
                onChange={onChange}
                onDelete={onDelete}
            />
        );
    }

    if (rule.type === 'llm_judge') {
        return (
            <LLMRuleEditor
                rule={rule}
                onChange={onChange}
                onDelete={onDelete}
            />
        );
    }

    return null;
};

export default RuleEditor;
