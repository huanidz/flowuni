import { TestCaseStatus } from './types';

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
    [TestCaseStatus.PENDING]: '#6b7280', // gray-500
    [TestCaseStatus.QUEUED]: '#f59e0b', // amber-500
    [TestCaseStatus.RUNNING]: '#3b82f6', // blue-500
    [TestCaseStatus.PASSED]: '#10b981', // emerald-500
    [TestCaseStatus.FAILED]: '#ef4444', // red-500
    [TestCaseStatus.CANCEL]: '#6b7280', // gray-500
} as const;
