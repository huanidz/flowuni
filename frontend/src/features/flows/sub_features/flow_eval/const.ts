import { TestCaseRunStatus } from './types';

/*
 * Test execution run types
 */
export const TEST_RUN_TYPES = {
    ALL: 'all',
    FAILED: 'failed',
    SELECTED: 'selected',
} as const;

/**
 * Test status colors for UI
 */
export const TEST_STATUS_COLORS = {
    [TestCaseRunStatus.PENDING]: '#6b7280', // gray-500
    [TestCaseRunStatus.QUEUED]: '#f59e0b', // amber-500
    [TestCaseRunStatus.RUNNING]: '#3b82f6', // blue-500
    [TestCaseRunStatus.PASSED]: '#10b981', // emerald-500
    [TestCaseRunStatus.FAILED]: '#ef4444', // red-500
    [TestCaseRunStatus.CANCEL]: '#6b7280', // gray-500
} as const;

/**
 * Test criteria rule types
 */
export const TEST_CRITERIA_RULE_TYPES = {
    STRING: 'string',
    REGEX: 'regex',
    LLM_JUDGE: 'llm_judge',
} as const;

/**
 * Test criteria rule type union
 */
export type TestCriteriaRuleType =
    (typeof TEST_CRITERIA_RULE_TYPES)[keyof typeof TEST_CRITERIA_RULE_TYPES];
