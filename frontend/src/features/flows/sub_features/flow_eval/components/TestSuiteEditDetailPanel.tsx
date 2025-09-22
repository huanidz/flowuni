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
        <div className="w-full md:w-2/3 overflow-y-auto bg-white dark:bg-slate-800">
            {/* Header Section */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Test Case Details
                </h3>
            </div>

            {/* Content Area */}
            <div className="p-4">
                {selectedTestCase ? (
                    <div className="space-y-6">
                        {/* Title Section */}
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                {selectedTestCase.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Test Case
                                </span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex-shrink-0">
                                    {getStatusBadge(
                                        selectedTestCase.status ||
                                            TestCaseStatus.PENDING
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Description
                                </h5>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {selectedTestCase.description ||
                                        'No description provided'}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Test Case ID
                                </h5>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {String(selectedTestCase.case_id)}
                                </p>
                            </div>

                            {selectedTestCase.execution_time_ms && (
                                <div>
                                    <h5 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Execution Time
                                    </h5>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        {selectedTestCase.execution_time_ms}ms
                                    </p>
                                </div>
                            )}

                            {selectedTestCase.error_message && (
                                <div>
                                    <h5 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Error Message
                                    </h5>
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
                                            {selectedTestCase.error_message}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            No Test Case Selected
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                            Select a test case from the list to view its
                            details.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSuiteEditDetailPanel;
