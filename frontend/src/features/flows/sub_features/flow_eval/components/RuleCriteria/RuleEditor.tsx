import React from 'react';
import StringRuleEditor from './StringRuleEditor';
import RegexRuleEditor from './RegexRuleEditor';
import LLMRuleEditor from './LLMRuleEditor';
import { TEST_CRITERIA_RULE_TYPES } from '../../const';
import type {
    TestRule,
    StringRuleConfig,
    RegexRuleConfig,
    LLMProviderConfig,
    LLMRuleConfig,
    StringRule,
    RegexRule,
    LLMRule,
} from '../../types';

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
