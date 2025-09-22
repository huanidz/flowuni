import React from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';

interface TestSuiteEditDetailPanelProps {
    selectedTestCase: FlowTestCase | null;
}

/**
 * Right panel component for displaying test case details in TestSuiteEdit modal
 */
const TestSuiteEditDetailPanel: React.FC<TestSuiteEditDetailPanelProps> = ({
    selectedTestCase,
}) => {
    return (
        <div className="w-full md:w-1/2 overflow-y-auto">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">
                    Test Case Details
                </h3>
            </div>
            <div className="p-4">
                {selectedTestCase ? (
                    <div>
                        <h4 className="text-lg font-medium mb-4">
                            {selectedTestCase.name}
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Description
                                </h5>
                                <p className="text-sm text-gray-700">
                                    {selectedTestCase.description ||
                                        'No description provided'}
                                </p>
                            </div>
                            <div>
                                <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Status
                                </h5>
                                <div>
                                    {getStatusBadge(
                                        selectedTestCase.status ||
                                            TestCaseStatus.PENDING
                                    )}
                                </div>
                            </div>
                            <div>
                                <h5 className="text-sm font-medium text-gray-500 mb-1">
                                    Test Case ID
                                </h5>
                                <p className="text-sm text-gray-700 font-mono">
                                    {String(selectedTestCase.case_id)}
                                </p>
                            </div>
                            {selectedTestCase.execution_time_ms && (
                                <div>
                                    <h5 className="text-sm font-medium text-gray-500 mb-1">
                                        Execution Time
                                    </h5>
                                    <p className="text-sm text-gray-700">
                                        {selectedTestCase.execution_time_ms}ms
                                    </p>
                                </div>
                            )}
                            {selectedTestCase.error_message && (
                                <div>
                                    <h5 className="text-sm font-medium text-gray-500 mb-1">
                                        Error Message
                                    </h5>
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-xs text-red-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                                            {selectedTestCase.error_message}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        Select a test case to view details
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSuiteEditDetailPanel;
