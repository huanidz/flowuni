import React from 'react';
import type { FlowTestSuiteWithCases } from '../types';
import { TestCaseStatus } from '../types';
import TestCaseItem from './TestCaseItem';
import TestStatusIndicator from './TestStatusIndicator';

interface TestSuiteGroupProps {
    testSuite: FlowTestSuiteWithCases;
    selectedTestCases: Set<string>;
    onTestCaseSelect: (testCaseId: string) => void;
    expandedSuites: Set<string>;
    onToggleExpand: (suiteId: string) => void;
}

/**
 * Component to display a test suite group with collapsible test cases
 */
const TestSuiteGroup: React.FC<TestSuiteGroupProps> = ({
    testSuite,
    selectedTestCases,
    onTestCaseSelect,
    expandedSuites,
    onToggleExpand,
}) => {
    const isExpanded = expandedSuites.has(testSuite.suite_id);

    // Calculate suite statistics
    const totalTests = testSuite.test_cases.length;
    const passedTests = testSuite.test_cases.filter(
        tc => tc.status === TestCaseStatus.PASSED
    ).length;
    const failedTests = testSuite.test_cases.filter(
        tc => tc.status === TestCaseStatus.FAILED
    ).length;
    const runningTests = testSuite.test_cases.filter(
        tc => tc.status === TestCaseStatus.RUNNING
    ).length;
    const pendingTests = testSuite.test_cases.filter(
        tc => tc.status === TestCaseStatus.PENDING || !tc.status
    ).length;

    const toggleExpand = () => {
        onToggleExpand(testSuite.suite_id);
    };

    const getSuiteStatus = (): TestCaseStatus => {
        if (runningTests > 0) return TestCaseStatus.RUNNING;
        if (failedTests > 0) return TestCaseStatus.FAILED;
        if (passedTests > 0) return TestCaseStatus.PASSED;
        return TestCaseStatus.PENDING;
    };

    return (
        <div
            className={`border rounded bg-white transition-all duration-300 ${isExpanded ? 'bg-gray-50' : ''}`}
        >
            {/* Suite Header */}
            <div className="p-3 cursor-pointer" onClick={toggleExpand}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button
                                className={`p-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            >
                                <svg
                                    className="w-3 h-3 text-gray-400"
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
                            <h3 className="text-sm font-medium">
                                {testSuite.name}
                            </h3>
                        </div>
                        <TestStatusIndicator status={getSuiteStatus()} />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{totalTests} tests</span>
                        <div className="flex gap-2">
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
                    <p className="text-xs text-gray-600 mt-1">
                        {testSuite.description}
                    </p>
                )}
            </div>

            {/* Test Cases - Tree Style */}
            <div
                className={`overflow-hidden transition-all duration-300 ${
                    isExpanded
                        ? 'max-h-[2000px] opacity-100'
                        : 'max-h-0 opacity-0'
                }`}
            >
                <div className="border-t relative">
                    {/* Tree connector line */}
                    {isExpanded && (
                        <div
                            className="absolute left-4 top-0 w-px h-full bg-gray-300"
                            style={{ height: `calc(100% - 0.5rem)` }}
                        />
                    )}

                    <div className="p-1 space-y-1">
                        {testSuite.test_cases.map((testCase, index) => (
                            <div
                                key={testCase.case_id}
                                className="relative flex items-start"
                            >
                                {/* Horizontal connector line */}
                                {isExpanded && (
                                    <div className="absolute left-4 top-4 w-4 h-px bg-gray-300" />
                                )}

                                {/* Tree item with indentation */}
                                <div className="pl-8 flex-1">
                                    <TestCaseItem
                                        testCase={testCase}
                                        isSelected={selectedTestCases.has(
                                            testCase.case_id
                                        )}
                                        onSelect={onTestCaseSelect}
                                        suiteName={testSuite.name}
                                        showSuiteName={false}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestSuiteGroup;
