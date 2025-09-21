import React, { useState } from 'react';
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
        <div className="border border-gray-200 rounded-lg bg-white">
            {/* Suite Header */}
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

            {/* Test Cases */}
            {isExpanded && (
                <div className="border-t border-gray-200">
                    <div className="p-2 space-y-2">
                        {testSuite.test_cases.map(testCase => (
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

export default TestSuiteGroup;
