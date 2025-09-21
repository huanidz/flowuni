import type { FlowTestSuiteWithCases } from './types';
import { TestCaseStatus } from './types';

/**
 * Dummy data for Flow Evaluation
 * Based on backend FlowTestSuiteModel and FlowTestCaseModel schemas
 */

export const DUMMY_TEST_SUITES: FlowTestSuiteWithCases[] = [
    {
        id: 1,
        suite_id: 'suite-001',
        flow_id: 'flow-123',
        name: 'Basic Flow Tests',
        description: 'Basic functionality tests for the main flow',
        is_active: true,
        suite_metadata: {
            category: 'functional',
            priority: 'high',
        },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        test_cases: [
            {
                id: 1,
                case_id: 'case-001',
                suite_id: 1,
                name: 'Input Validation Test',
                description: 'Test that validates input data format',
                is_active: true,
                input_data: {
                    user_id: 'user-123',
                    action: 'create',
                    data: { name: 'test', value: 123 },
                },
                expected_output: {
                    status: 'success',
                    result: { validated: true },
                },
                test_metadata: {
                    test_type: 'validation',
                    difficulty: 'easy',
                },
                timeout_ms: 5000,
                status: TestCaseStatus.PASSED,
                actual_output: {
                    status: 'success',
                    result: { validated: true },
                },
                execution_time_ms: 1234,
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:30:00Z',
            },
            {
                id: 2,
                case_id: 'case-002',
                suite_id: 1,
                name: 'Data Processing Test',
                description: 'Test data processing pipeline',
                is_active: true,
                input_data: {
                    source: 'api',
                    data: [1, 2, 3, 4, 5],
                },
                expected_output: {
                    processed: true,
                    sum: 15,
                    average: 3,
                },
                test_metadata: {
                    test_type: 'processing',
                    difficulty: 'medium',
                },
                timeout_ms: 10000,
                status: TestCaseStatus.FAILED,
                actual_output: {
                    processed: false,
                    error: 'Processing timeout',
                },
                error_message: 'Processing pipeline failed due to timeout',
                execution_time_ms: 15000,
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:35:00Z',
            },
            {
                id: 3,
                case_id: 'case-003',
                suite_id: 1,
                name: 'Output Format Test',
                description: 'Test that output format matches specification',
                is_active: true,
                input_data: {
                    format: 'json',
                    include_metadata: true,
                },
                expected_output: {
                    format: 'json',
                    has_metadata: true,
                    structure: 'valid',
                },
                test_metadata: {
                    test_type: 'format',
                    difficulty: 'easy',
                },
                timeout_ms: 3000,
                status: TestCaseStatus.RUNNING,
                execution_time_ms: 1200,
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:40:00Z',
            },
        ],
    },
    {
        id: 2,
        suite_id: 'suite-002',
        flow_id: 'flow-123',
        name: 'Performance Tests',
        description: 'Performance and load testing scenarios',
        is_active: true,
        suite_metadata: {
            category: 'performance',
            priority: 'medium',
        },
        created_at: '2025-01-15T11:00:00Z',
        updated_at: '2025-01-15T11:00:00Z',
        test_cases: [
            {
                id: 4,
                case_id: 'case-004',
                suite_id: 2,
                name: 'Response Time Test',
                description: 'Test API response time under normal load',
                is_active: true,
                input_data: {
                    endpoint: '/api/process',
                    concurrent_requests: 10,
                    payload_size: 'medium',
                },
                expected_output: {
                    average_response_time_ms: 500,
                    max_response_time_ms: 2000,
                    success_rate: 0.95,
                },
                test_metadata: {
                    test_type: 'performance',
                    difficulty: 'medium',
                },
                timeout_ms: 30000,
                status: TestCaseStatus.PENDING,
                created_at: '2025-01-15T11:00:00Z',
                updated_at: '2025-01-15T11:00:00Z',
            },
            {
                id: 5,
                case_id: 'case-005',
                suite_id: 2,
                name: 'Memory Usage Test',
                description: 'Test memory consumption during processing',
                is_active: true,
                input_data: {
                    data_volume: 'large',
                    iterations: 100,
                },
                expected_output: {
                    peak_memory_mb: 256,
                    memory_leaks: false,
                },
                test_metadata: {
                    test_type: 'memory',
                    difficulty: 'hard',
                },
                timeout_ms: 60000,
                status: TestCaseStatus.QUEUED,
                created_at: '2025-01-15T11:00:00Z',
                updated_at: '2025-01-15T11:00:00Z',
            },
        ],
    },
    {
        id: 3,
        suite_id: 'suite-003',
        flow_id: 'flow-123',
        name: 'Edge Case Tests',
        description: 'Testing edge cases and error conditions',
        is_active: true,
        suite_metadata: {
            category: 'edge-cases',
            priority: 'low',
        },
        created_at: '2025-01-15T12:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
        test_cases: [
            {
                id: 6,
                case_id: 'case-006',
                suite_id: 3,
                name: 'Empty Input Test',
                description: 'Test behavior with empty input data',
                is_active: true,
                input_data: {},
                expected_output: {
                    handled_gracefully: true,
                    error_message: 'Input data is empty',
                },
                test_metadata: {
                    test_type: 'edge-case',
                    difficulty: 'easy',
                },
                timeout_ms: 5000,
                status: TestCaseStatus.PASSED,
                actual_output: {
                    handled_gracefully: true,
                    error_message: 'Input data is empty',
                },
                execution_time_ms: 567,
                created_at: '2025-01-15T12:00:00Z',
                updated_at: '2025-01-15T12:15:00Z',
            },
            {
                id: 7,
                case_id: 'case-007',
                suite_id: 3,
                name: 'Invalid Data Type Test',
                description: 'Test behavior with invalid data types',
                is_active: true,
                input_data: {
                    data: 'invalid_string_instead_of_number',
                },
                expected_output: {
                    validation_error: true,
                    error_type: 'type_error',
                },
                test_metadata: {
                    test_type: 'edge-case',
                    difficulty: 'medium',
                },
                timeout_ms: 5000,
                status: TestCaseStatus.FAILED,
                actual_output: {
                    validation_error: false,
                    unexpected_result: 'Processing succeeded unexpectedly',
                },
                error_message:
                    'Expected validation error but processing succeeded',
                execution_time_ms: 2341,
                created_at: '2025-01-15T12:00:00Z',
                updated_at: '2025-01-15T12:20:00Z',
            },
        ],
    },
];

/**
 * Test statistics calculated from dummy data
 */
export const DUMMY_TEST_STATISTICS = {
    total: 7,
    passed: 2,
    failed: 2,
    pending: 1,
    running: 1,
};

/**
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
