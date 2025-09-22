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
        <div className="w-full md:w-1/3 border-r flex flex-col">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">
                    Test Cases ({testCases.length})
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
                {testCases.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No test cases found
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {testCases.map(testCase => (
                            <Card
                                key={String(testCase.case_id)}
                                className={`cursor-pointer transition-colors ${
                                    String(selectedTestCase?.case_id) ===
                                    String(testCase.case_id)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onTestCaseSelect(testCase)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                CASE
                                            </Badge>
                                            <h4 className="text-sm font-medium truncate">
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
            <div className="p-4 border-t bg-gray-50">
                <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add test case
                </Button>
            </div>
        </div>
    );
};

export default TestSuiteEditListPanel;
