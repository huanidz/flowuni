import React from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';

interface TestSuiteEditListPanelProps {
    testCases: FlowTestCase[];
    selectedTestCase: FlowTestCase | null;
    onTestCaseSelect: (testCase: FlowTestCase) => void;
}

/**
 * Left panel component for displaying list of test cases in TestSuiteEdit modal
 */
const TestSuiteEditListPanel: React.FC<TestSuiteEditListPanelProps> = ({
    testCases,
    selectedTestCase,
    onTestCaseSelect,
}) => {
    return (
        <div className="w-full md:w-1/2 border-r overflow-y-auto">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">
                    Test Cases ({testCases.length})
                </h3>
            </div>
            <div className="divide-y">
                {testCases.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No test cases found
                    </div>
                ) : (
                    testCases.map(testCase => (
                        <div
                            key={testCase.case_id}
                            className={`p-4 cursor-pointer transition-colors ${
                                selectedTestCase?.case_id === testCase.case_id
                                    ? 'bg-blue-50'
                                    : 'hover:bg-gray-50'
                            }`}
                            onClick={() => onTestCaseSelect(testCase)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                            CASE
                                        </span>
                                        <h4 className="text-sm font-medium truncate">
                                            {testCase.name}
                                        </h4>
                                    </div>
                                    {testCase.description && (
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                            {testCase.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>
                                            ID:{' '}
                                            {testCase.case_id?.substring(
                                                0,
                                                8
                                            ) || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                    {getStatusBadge(
                                        testCase.status ||
                                            TestCaseStatus.PENDING
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TestSuiteEditListPanel;
