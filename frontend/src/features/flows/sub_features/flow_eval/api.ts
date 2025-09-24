import api from '@/api/secureClient';
import type {
    FlowTestRunRequest,
    FlowTestRunResponse,
    TestCaseCreateRequest,
    TestCaseCreateResponse,
    TestCaseGetResponse,
    TestCasePartialUpdateRequest,
    TestCaseUpdateResponse,
    TestSuiteCreateRequest,
    TestSuiteCreateResponse,
    TestSuitesWithCasePreviewsResponse,
} from './types';

/**
 * Create a new test suite for a flow
 */
export const createTestSuite = async (
    request: TestSuiteCreateRequest
): Promise<TestSuiteCreateResponse> => {
    const { data } = await api.post('/flow-tests/suites', request);
    return data;
};

/**
 * Create a new test case for a test suite
 */
export const createTestCase = async (
    request: TestCaseCreateRequest
): Promise<TestCaseCreateResponse> => {
    const { data } = await api.post('/flow-tests/cases', request);
    return data;
};

/**
 * Delete a test suite by its ID
 */
export const deleteTestSuite = async (suiteId: number): Promise<void> => {
    await api.delete(`/flow-tests/suites/${suiteId}`);
};

/**
 * Delete a test case by its ID
 */
export const deleteTestCase = async (caseId: number): Promise<void> => {
    await api.delete(`/flow-tests/cases/${caseId}`);
};

/**
 * Get all test suites with their test case previews for a specific flow
 */
export const getTestSuitesWithCases = async (
    flowId: string
): Promise<TestSuitesWithCasePreviewsResponse> => {
    const { data } = await api.get(
        `/flow-tests/suites-with-previews/${flowId}`
    );
    return data;
};

/**
 * Get a test case by its ID
 */
export const getTestCase = async (
    caseId: number
): Promise<TestCaseGetResponse> => {
    const { data } = await api.get(`/flow-tests/cases/${caseId}`);
    return data;
};

/**
 * Partially update a test case by its ID
 */
export const partialUpdateTestCase = async (
    caseId: number,
    request: TestCasePartialUpdateRequest
): Promise<TestCaseUpdateResponse> => {
    const { data } = await api.patch(`/flow-tests/cases/${caseId}`, request);
    return data;
};

// ======== TEST RUN ========

/**
 * Run a single flow test
 */
export const runSingleTest = async (
    request: FlowTestRunRequest
): Promise<FlowTestRunResponse> => {
    const { data } = await api.post('/flow-test-runs/', request);
    return data;
};
