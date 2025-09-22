/**
 * Types for Flow Evaluation functionality
 * Based on backend FlowTestSuiteModel and FlowTestCaseModel
 */

export type TestCaseStatus =
    | 'PENDING'
    | 'QUEUED'
    | 'RUNNING'
    | 'PASSED'
    | 'FAILED'
    | 'CANCEL';

export const TestCaseStatus = {
    PENDING: 'PENDING' as TestCaseStatus,
    QUEUED: 'QUEUED' as TestCaseStatus,
    RUNNING: 'RUNNING' as TestCaseStatus,
    PASSED: 'PASSED' as TestCaseStatus,
    FAILED: 'FAILED' as TestCaseStatus,
    CANCEL: 'CANCEL' as TestCaseStatus,
};

export interface TestSuiteMetadata {
    [key: string]: any;
}

export interface TestCaseMetadata {
    [key: string]: any;
}

export interface TestCaseInputData {
    [key: string]: any;
}

export interface TestCaseExpectedOutput {
    [key: string]: any;
}

export interface TestCaseActualOutput {
    [key: string]: any;
}

export interface TestRunDetail {
    [key: string]: any;
}

/**
 * Flow Test Suite interface based on FlowTestSuiteModel
 */
export interface FlowTestSuite {
    id: number;
    suite_id: string;
    flow_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    suite_metadata?: TestSuiteMetadata;
}

/**
 * Flow Test Case interface based on FlowTestCaseModel
 */
export interface FlowTestCase {
    id: number;
    case_id: string;
    suite_id: number;
    name: string;
    description?: string;
    is_active: boolean;
    input_data?: TestCaseInputData;
    expected_output?: TestCaseExpectedOutput;
    test_metadata?: TestCaseMetadata;
    run_detail?: TestRunDetail;
    timeout_ms?: number;
    status?: TestCaseStatus;
    actual_output?: TestCaseActualOutput;
    error_message?: string;
    execution_time_ms?: number;
}

/**
 * Test Suite with nested test cases
 */
export interface FlowTestSuiteWithCases extends FlowTestSuite {
    test_cases: FlowTestCase[];
}

/**
 * Test execution request interface
 */
export interface TestExecutionRequest {
    test_case_ids?: string[];
    test_suite_ids?: string[];
    run_type: 'all' | 'failed' | 'selected';
}

/**
 * Test execution result interface
 */
export interface TestExecutionResult {
    test_case_id: string;
    status: TestCaseStatus;
    execution_time_ms?: number;
    error_message?: string;
    actual_output?: TestCaseActualOutput;
}

/**
 * Test statistics interface
 */
export interface TestStatistics {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    running: number;
}

/**
 * Test suite creation request interface
 */
export interface TestSuiteCreateRequest {
    flow_id: string;
    name: string;
    description?: string;
}

/**
 * Test suite creation response interface
 */
export interface TestSuiteCreateResponse {
    id: number;
    flow_id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

/**
 * Selected test cases for execution
 */
export interface SelectedTestCase {
    id: string;
    name: string;
    suite_name: string;
    status?: TestCaseStatus;
}

/**
 * Test case creation request interface
 */
export interface TestCaseCreateRequest {
    suite_id: number;
    name: string;
    description?: string;
    input_data?: TestCaseInputData;
    expected_output?: TestCaseExpectedOutput;
    test_metadata?: TestCaseMetadata;
    run_detail?: TestRunDetail;
    timeout_ms?: number;
}

/**
 * Test case creation response interface
 */
export interface TestCaseCreateResponse {
    id: number;
    case_id: number;
    suite_id: number;
    name: string;
    description?: string;
    is_active: boolean;
    input_data?: TestCaseInputData;
    expected_output?: TestCaseExpectedOutput;
    test_metadata?: TestCaseMetadata;
    run_detail?: TestRunDetail;
    timeout_ms?: number;
    status?: TestCaseStatus;
    actual_output?: TestCaseActualOutput;
    error_message?: string;
    execution_time_ms?: number;
}

/**
 * Draft test case interface for UI state management
 */
export interface DraftTestCase {
    id: string; // Temporary ID for UI purposes
    name: string;
    isEditing: boolean;
}
