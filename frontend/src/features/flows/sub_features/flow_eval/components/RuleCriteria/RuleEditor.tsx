import React from 'react';
import StringRuleEditor from './StringRuleEditor';
import RegexRuleEditor from './RegexRuleEditor';
import LLMRuleEditor from './LLMRuleEditor';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';

export interface StringRuleConfig {
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
}

export interface RegexRuleConfig {
    pattern: string;
    flags?: string[];
}

export interface LLMProviderConfig {
    provider: string;
    model: string;
    api_key: string;
    system_prompt?: string;
    temperature?: number;
    max_output_tokens?: number;
}

export interface LLMRuleConfig {
    name?: string;
    description?: string;
    data?: LLMProviderConfig;
}

export interface StringRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.STRING;
    config: StringRuleConfig;
    id: number;
}

export interface RegexRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.REGEX;
    config: RegexRuleConfig;
    id: number;
}

export interface LLMRule {
    type: typeof TEST_CRITERIA_RULE_TYPES.LLM_JUDGE;
    config: LLMRuleConfig;
    id: number;
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
