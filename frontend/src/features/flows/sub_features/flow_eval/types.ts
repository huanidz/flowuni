/**
 * Types for Flow Evaluation functionality
 * Based on backend FlowTestSuiteModel and FlowTestCaseModel
 */

// Define TestRule types directly to avoid circular imports
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
    type: 'string';
    config: StringRuleConfig;
    id: number;
}

export interface RegexRule {
    type: 'regex';
    config: RegexRuleConfig;
    id: number;
}

export interface LLMRule {
    type: 'llm_judge';
    config: LLMRuleConfig;
    id: number;
}

export type TestRule = StringRule | RegexRule | LLMRule;

export type TestCaseRunStatus =
    | 'PENDING'
    | 'QUEUED'
    | 'RUNNING'
    | 'PASSED'
    | 'FAILED'
    | 'CANCEL';

export const TestCaseRunStatus = {
    PENDING: 'PENDING' as TestCaseRunStatus,
    QUEUED: 'QUEUED' as TestCaseRunStatus,
    RUNNING: 'RUNNING' as TestCaseRunStatus,
    PASSED: 'PASSED' as TestCaseRunStatus,
    FAILED: 'FAILED' as TestCaseRunStatus,
    CANCEL: 'CANCEL' as TestCaseRunStatus,
};

export interface TestSuiteMetadata {
    [key: string]: any;
}

export interface TestCaseMetadata {
    [key: string]: any;
}

export interface TestCasePassCriteria {
    rules: TestRule[];
    logics: string[]; // List of logic items ('AND' or 'OR')
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
    suite_id: number;
    name: string;
    description?: string;
    is_active: boolean;
    input_text?: string;
    pass_criteria?: TestCasePassCriteria;
    input_metadata?: TestCaseMetadata;
    timeout_ms?: number;
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
    status: TestCaseRunStatus;
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
    status?: TestCaseRunStatus;
}

/**
 * Test case creation request interface
 */
export interface TestCaseCreateRequest {
    suite_id: number;
    name: string;
    description?: string;
    input_text?: string;
    pass_criteria?: TestCasePassCriteria;
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
    input_text?: string;
    pass_criteria?: TestCasePassCriteria;
    test_metadata?: TestCaseMetadata;
    run_detail?: TestRunDetail;
    timeout_ms?: number;
    status?: TestCaseRunStatus;
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

/**
 * Test Case Preview interface based on backend TestCasePreview
 */
export interface TestCasePreview {
    id: number;
    suite_id: number;
    name: string;
    description?: string;
    is_active: boolean;
}

/**
 * Test Suite with Case Previews interface based on backend TestSuiteWithCasePreviews
 */
export interface TestSuiteWithCasePreviews {
    id: number;
    flow_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    test_cases: TestCasePreview[];
}

/**
 * Test Suites with Case Previews Response interface based on backend TestSuitesWithCasePreviewsResponse
 */
export interface TestSuitesWithCasePreviewsResponse {
    test_suites: TestSuiteWithCasePreviews[];
}

/**
 * Test Case Get Response interface based on backend TestCaseGetResponse
 */
export interface TestCaseGetResponse {
    id: number;
    suite_id: number;
    name: string;
    description?: string;
    is_active: boolean;
    input_text?: string;
    input_metadata?: Record<string, any>;
    pass_criteria?: Record<string, any>;
    timeout_ms?: number;
}

/**
 * Test case partial update request interface based on backend TestCasePartialUpdateRequest
 */
export interface TestCasePartialUpdateRequest {
    suite_id?: number;
    name?: string;
    description?: string;
    is_active?: boolean;
    input_text?: string;
    input_metadata?: Record<string, any>;
    pass_criteria?: Record<string, any>;
    timeout_ms?: number;
}

/**
 * Test case update response interface based on backend TestCaseUpdateResponse
 */
export interface TestCaseUpdateResponse {
    id: number;
    suite_id: number;
    name: string;
    description?: string;
    is_active: boolean;
    input_text?: string;
    input_metadata?: Record<string, any>;
    pass_criteria?: Record<string, any>;
    timeout_ms?: number;
}
