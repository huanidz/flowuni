import React, { useState, useMemo } from 'react';

// Inline components and data to avoid import issues
type TestCaseStatus =
    | 'PENDING'
    | 'QUEUED'
    | 'RUNNING'
    | 'PASSED'
    | 'FAILED'
    | 'CANCEL';

interface TestStatistics {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    running: number;
}

// Test status colors for UI
const TEST_STATUS_COLORS = {
    PENDING: '#6b7280',
    QUEUED: '#f59e0b',
    RUNNING: '#3b82f6',
    PASSED: '#10b981',
    FAILED: '#ef4444',
    CANCEL: '#6b7280',
} as const;

// Dummy data inline
const DUMMY_TEST_SUITES = [
    {
        id: 1,
        suite_id: 'suite-001',
        flow_id: 'flow-123',
        name: 'Basic Flow Tests',
        description: 'Basic functionality tests for the main flow',
        is_active: true,
        suite_metadata: { category: 'functional', priority: 'high' },
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
                test_metadata: { test_type: 'validation', difficulty: 'easy' },
                timeout_ms: 5000,
                status: 'PASSED' as TestCaseStatus,
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
                input_data: { source: 'api', data: [1, 2, 3, 4, 5] },
                expected_output: { processed: true, sum: 15, average: 3 },
                test_metadata: {
                    test_type: 'processing',
                    difficulty: 'medium',
                },
                timeout_ms: 10000,
                status: 'FAILED' as TestCaseStatus,
                actual_output: {
                    processed: false,
                    error: 'Processing timeout',
                },
                error_message: 'Processing pipeline failed due to timeout',
                execution_time_ms: 15000,
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:35:00Z',
            },
        ],
    },
];

// Inline TestStatusIndicator component
const TestStatusIndicator: React.FC<{
    status: TestCaseStatus;
    executionTimeMs?: number;
    showExecutionTime?: boolean;
}> = ({ status, executionTimeMs, showExecutionTime = false }) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'PENDING':
                return (
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm" />
                );
            case 'QUEUED':
                return (
                    <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                );
            case 'RUNNING':
                return (
                    <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-sm animate-pulse" />
                );
            case 'PASSED':
                return (
                    <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm">
                        <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <path
                                d="M2.3 4L3.5 5.2L5.7 2.8"
                                stroke="white"
                                strokeWidth="1"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                );
            case 'FAILED':
                return (
                    <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-white shadow-sm">
                        <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <path
                                d="M2 2L6 6M6 2L2 6"
                                stroke="white"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                );
            case 'CANCEL':
                return (
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm">
                        <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <path
                                d="M2 4H6"
                                stroke="white"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm" />
                );
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'QUEUED':
                return 'Queued';
            case 'RUNNING':
                return 'Running';
            case 'PASSED':
                return 'Passed';
            case 'FAILED':
                return 'Failed';
            case 'CANCEL':
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span
                className="text-sm font-medium"
                style={{ color: TEST_STATUS_COLORS[status] }}
            >
                {getStatusText()}
            </span>
            {showExecutionTime && executionTimeMs && (
                <span className="text-xs text-gray-500">
                    ({executionTimeMs}ms)
                </span>
            )}
        </div>
    );
};

// Inline TestCaseItem component
const TestCaseItem: React.FC<{
    testCase: any;
    isSelected?: boolean;
    onSelect?: (testCaseId: string) => void;
    showSuiteName?: boolean;
    suiteName?: string;
}> = ({
    testCase,
    isSelected = false,
    onSelect,
    showSuiteName = false,
    suiteName,
}) => {
    const handleClick = () => {
        if (onSelect) {
            onSelect(testCase.case_id);
        }
    };

    const formatExecutionTime = (ms?: number) => {
        if (!ms) return '';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div
            className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={handleClick}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                            {testCase.name}
                        </h4>
                        {showSuiteName && suiteName && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {suiteName}
                            </span>
                        )}
                    </div>
                    {testCase.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {testCase.description}
                        </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Case ID: {testCase.case_id}</span>
                        {testCase.execution_time_ms && (
                            <span>
                                Duration:{' '}
                                {formatExecutionTime(
                                    testCase.execution_time_ms
                                )}
                            </span>
                        )}
                        <span>
                            Timeout: {formatExecutionTime(testCase.timeout_ms)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <TestStatusIndicator
                        status={testCase.status || 'PENDING'}
                        executionTimeMs={testCase.execution_time_ms}
                        showExecutionTime={false}
                    />
                </div>
            </div>
            {testCase.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="whitespace-pre-wrap">
                        {testCase.error_message}
                    </div>
                </div>
            )}
        </div>
    );
};

// Inline TestSuiteGroup component
const TestSuiteGroup: React.FC<{
    testSuite: any;
    selectedTestCases: Set<string>;
    onTestCaseSelect: (testCaseId: string) => void;
    expandedSuites: Set<string>;
    onToggleExpand: (suiteId: string) => void;
}> = ({
    testSuite,
    selectedTestCases,
    onTestCaseSelect,
    expandedSuites,
    onToggleExpand,
}) => {
    const isExpanded = expandedSuites.has(testSuite.suite_id);

    const totalTests = testSuite.test_cases.length;
    const passedTests = testSuite.test_cases.filter(
        (tc: any) => tc.status === 'PASSED'
    ).length;
    const failedTests = testSuite.test_cases.filter(
        (tc: any) => tc.status === 'FAILED'
    ).length;
    const runningTests = testSuite.test_cases.filter(
        (tc: any) => tc.status === 'RUNNING'
    ).length;
    const pendingTests = testSuite.test_cases.filter(
        (tc: any) => tc.status === 'PENDING' || !tc.status
    ).length;

    const toggleExpand = () => {
        onToggleExpand(testSuite.suite_id);
    };

    const getSuiteStatus = (): TestCaseStatus => {
        if (runningTests > 0) return 'RUNNING';
        if (failedTests > 0) return 'FAILED';
        if (passedTests > 0) return 'PASSED';
        return 'PENDING';
    };

    return (
        <div className="border border-gray-200 rounded-lg bg-white">
            <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={toggleExpand}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                className={`p-1 rounded transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            >
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                            <h3 className="text-base font-semibold text-gray-900">
                                {testSuite.name}
                            </h3>
                        </div>
                        <TestStatusIndicator status={getSuiteStatus()} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{totalTests} tests</span>
                        <div className="flex gap-3">
                            {passedTests > 0 && (
                                <span className="text-emerald-600">
                                    {passedTests} passed
                                </span>
                            )}
                            {failedTests > 0 && (
                                <span className="text-red-600">
                                    {failedTests} failed
                                </span>
                            )}
                            {runningTests > 0 && (
                                <span className="text-blue-600">
                                    {runningTests} running
                                </span>
                            )}
                            {pendingTests > 0 && (
                                <span className="text-gray-600">
                                    {pendingTests} pending
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {testSuite.description && (
                    <p className="text-sm text-gray-600 mt-2">
                        {testSuite.description}
                    </p>
                )}
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200">
                    <div className="p-2 space-y-2">
                        {testSuite.test_cases.map((testCase: any) => (
                            <TestCaseItem
                                key={testCase.case_id}
                                testCase={testCase}
                                isSelected={selectedTestCases.has(
                                    testCase.case_id
                                )}
                                onSelect={onTestCaseSelect}
                                suiteName={testSuite.name}
                                showSuiteName={false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Inline TestActionButtons component
const TestActionButtons: React.FC<{
    statistics: TestStatistics;
    selectedCount: number;
    onRunAll: () => void;
    onRunFailed: () => void;
    onRunSelected: () => void;
    isRunning?: boolean;
}> = ({
    statistics,
    selectedCount,
    onRunAll,
    onRunFailed,
    onRunSelected,
    isRunning = false,
}) => {
    const hasFailedTests = statistics.failed > 0;
    const hasSelectedTests = selectedCount > 0;

    return (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 border-b">
            <button
                onClick={onRunAll}
                disabled={isRunning || statistics.total === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning || statistics.total === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-2"
                    />
                </svg>
                {isRunning
                    ? 'Running Tests...'
                    : `Run All Tests (${statistics.total})`}
            </button>
            <button
                onClick={onRunFailed}
                disabled={isRunning || !hasFailedTests}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning || !hasFailedTests
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
                }`}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
                {isRunning
                    ? 'Running Tests...'
                    : `Run Failed Tests (${statistics.failed})`}
            </button>
            <button
                onClick={onRunSelected}
                disabled={isRunning || !hasSelectedTests}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning || !hasSelectedTests
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                }`}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
                {isRunning
                    ? 'Running Tests...'
                    : `Run Selected Tests (${selectedCount})`}
            </button>
            <div className="flex items-center gap-4 ml-auto text-sm text-gray-600">
                <div className="flex items-center gap-4">
                    <span>
                        Total: <strong>{statistics.total}</strong>
                    </span>
                    <span className="text-emerald-600">
                        Passed: <strong>{statistics.passed}</strong>
                    </span>
                    <span className="text-red-600">
                        Failed: <strong>{statistics.failed}</strong>
                    </span>
                    <span className="text-blue-600">
                        Running: <strong>{statistics.running}</strong>
                    </span>
                    <span className="text-gray-600">
                        Pending: <strong>{statistics.pending}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * Main Flow Evaluation Content Component
 * Displays test suites and test cases with execution controls
 */
const LCEvalContent: React.FC = () => {
    const [expandedSuites, setExpandedSuites] = useState<Set<string>>(
        new Set()
    );
    const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(
        new Set()
    );
    const [isRunning, setIsRunning] = useState(false);

    const statistics = useMemo((): TestStatistics => {
        const allTestCases = DUMMY_TEST_SUITES.flatMap(
            suite => suite.test_cases
        );
        return {
            total: allTestCases.length,
            passed: allTestCases.filter(tc => tc.status === 'PASSED').length,
            failed: allTestCases.filter(tc => tc.status === 'FAILED').length,
            pending: allTestCases.filter(
                tc => tc.status === 'PENDING' || !tc.status
            ).length,
            running: allTestCases.filter(tc => tc.status === 'RUNNING').length,
        };
    }, []);

    const handleToggleExpand = (suiteId: string) => {
        const newExpanded = new Set(expandedSuites);
        if (newExpanded.has(suiteId)) {
            newExpanded.delete(suiteId);
        } else {
            newExpanded.add(suiteId);
        }
        setExpandedSuites(newExpanded);
    };

    const handleTestCaseSelect = (testCaseId: string) => {
        const newSelected = new Set(selectedTestCases);
        if (newSelected.has(testCaseId)) {
            newSelected.delete(testCaseId);
        } else {
            newSelected.add(testCaseId);
        }
        setSelectedTestCases(newSelected);
    };

    const handleRunAll = () => {
        setIsRunning(true);
        console.log('Running all tests...');
        setTimeout(() => {
            setIsRunning(false);
            console.log('All tests completed');
        }, 3000);
    };

    const handleRunFailed = () => {
        setIsRunning(true);
        console.log('Running failed tests...');
        setTimeout(() => {
            setIsRunning(false);
            console.log('Failed tests completed');
        }, 2000);
    };

    const handleRunSelected = () => {
        setIsRunning(true);
        console.log(
            `Running selected tests: ${Array.from(selectedTestCases).join(', ')}`
        );
        setTimeout(() => {
            setIsRunning(false);
            console.log('Selected tests completed');
        }, 1500);
    };

    React.useEffect(() => {
        const allSuiteIds = new Set(
            DUMMY_TEST_SUITES.map(suite => suite.suite_id)
        );
        setExpandedSuites(allSuiteIds);
    }, []);

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Flow Evaluation
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Run and monitor your flow test suites
                </p>
            </div>

            <TestActionButtons
                statistics={statistics}
                selectedCount={selectedTestCases.size}
                onRunAll={handleRunAll}
                onRunFailed={handleRunFailed}
                onRunSelected={handleRunSelected}
                isRunning={isRunning}
            />

            <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-4">
                    {DUMMY_TEST_SUITES.map(suite => (
                        <TestSuiteGroup
                            key={suite.suite_id}
                            testSuite={suite}
                            selectedTestCases={selectedTestCases}
                            onTestCaseSelect={handleTestCaseSelect}
                            expandedSuites={expandedSuites}
                            onToggleExpand={handleToggleExpand}
                        />
                    ))}

                    {DUMMY_TEST_SUITES.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <svg
                                className="w-12 h-12 mx-auto mb-4 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Test Suites
                            </h3>
                            <p className="text-sm">
                                Create test suites to start evaluating your
                                flow.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LCEvalContent;
