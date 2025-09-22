import React from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
        <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
            {/* Header Section */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Test Cases
                    </h3>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        {testCases.length}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {testCases.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center m-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            No Test Cases Available
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                            Create test cases to validate your flow
                            functionality.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        {/* Section Header - Sticky */}
                        <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 py-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Test Cases
                                </span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                    {testCases.length} items
                                </span>
                            </div>
                        </div>

                        {testCases.map(testCase => (
                            <Card
                                key={String(testCase.case_id)}
                                className={`cursor-pointer transition-colors ${
                                    String(selectedTestCase?.case_id) ===
                                    String(testCase.case_id)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                                onClick={() => onTestCaseSelect(testCase)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                            >
                                                CASE
                                            </Badge>
                                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                {testCase.name}
                                            </h4>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getStatusBadge(
                                                testCase.status ||
                                                    TestCaseStatus.PENDING
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <Button
                    variant="outline"
                    className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add test case
                </Button>
            </div>
        </div>
    );
};

export default TestSuiteEditListPanel;
