import api from '@/api/secureClient';
import type {
    FlowTestSuiteWithCases,
    TestCaseCreateRequest,
    TestCaseCreateResponse,
    TestSuiteCreateRequest,
    TestSuiteCreateResponse,
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
 * Get all test suites with their test cases for a specific flow
 */
export const getTestSuitesWithCases = async (
    flowId: string
): Promise<FlowTestSuiteWithCases[]> => {
    const { data } = await api.get('/flow-tests/suites', {
        params: { flow_id: flowId },
    });
    return data;
};
