import React from 'react';
import StringRuleEditor from './StringRuleEditor';
import RegexRuleEditor from './RegexRuleEditor';
import LLMRuleEditor from './LLMRuleEditor';
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

export interface RegexRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.REGEX;
    pattern: string;
    flags?: string;
    id: string;
}

export interface LLMRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.LLM_JUDGE;
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
    if (rule.type === TEST_CRITERIA_RULE_TYPES.STRING) {
        return (
            <StringRuleEditor
                rule={rule}
                onChange={onChange}
                onDelete={onDelete}
            />
        );
    }

    if (rule.type === TEST_CRITERIA_RULE_TYPES.REGEX) {
        return (
            <RegexRuleEditor
                rule={rule}
                onChange={onChange}
                onDelete={onDelete}
            />
        );
    }

    if (rule.type === TEST_CRITERIA_RULE_TYPES.LLM_JUDGE) {
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
