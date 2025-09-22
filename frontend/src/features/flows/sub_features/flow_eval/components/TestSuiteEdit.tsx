import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';

interface TestSuiteEditProps {
    isOpen: boolean;
    onClose: () => void;
    testSuite: {
        id: number;
        suite_id: string;
        name: string;
        description?: string;
        flow_id: string;
    };
    testCases?: FlowTestCase[];
}

/**
 * Modal component for editing test suites with split layout
 */
const TestSuiteEdit: React.FC<TestSuiteEditProps> = ({
    isOpen,
    onClose,
    testSuite,
    testCases = [],
}) => {
    const [selectedTestCase, setSelectedTestCase] =
        React.useState<FlowTestCase | null>(
            testCases.length > 0 ? testCases[0] : null
        );

    const handleClose = () => {
        onClose();
    };

    const handleTestCaseSelect = (testCase: FlowTestCase) => {
        setSelectedTestCase(testCase);
    };

    const getStatusBadge = (status: TestCaseStatus) => {
        switch (status) {
            case TestCaseStatus.PASSED:
                return (
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        PASSED
                    </div>
                );
            case TestCaseStatus.FAILED:
                return (
                    <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        FAILED
                    </div>
                );
            case TestCaseStatus.RUNNING:
                return (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        RUNNING
                    </div>
                );
            case TestCaseStatus.PENDING:
            default:
                return (
                    <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        PENDING
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Edit Test Suite: {testSuite.name}</DialogTitle>
                </DialogHeader>

                {/* Split Layout */}
                <div className="flex flex-col md:flex-row h-[60vh] border rounded-lg overflow-hidden">
                    {/* Left Panel - List of Test Cases */}
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
                                            selectedTestCase?.case_id ===
                                            testCase.case_id
                                                ? 'bg-blue-50'
                                                : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() =>
                                            handleTestCaseSelect(testCase)
                                        }
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

                    {/* Right Panel - Test Case Details */}
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
                                                {selectedTestCase.case_id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Select a test case to view details
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TestSuiteEdit;
