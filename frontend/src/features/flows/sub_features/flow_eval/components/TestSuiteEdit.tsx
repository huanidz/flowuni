import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { TestCasePreview, FlowTestCase } from '../types';
import TestSuiteEditListPanel from './TestSuiteEditListPanel';
import TestSuiteEditDetailPanel from './TestSuiteEditDetailPanel';

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
    testCases?: TestCasePreview[];
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
        React.useState<FlowTestCase | null>(null);

    const handleClose = () => {
        onClose();
    };

    const handleTestCaseSelect = (testCase: TestCasePreview) => {
        // Convert TestCasePreview to FlowTestCase for the detail panel
        setSelectedTestCase({
            ...testCase,
            case_id: `case_${testCase.id}`, // Generate a case_id since it's required
            input_data: undefined,
            pass_criteria: undefined,
            test_metadata: undefined,
            run_detail: undefined,
            timeout_ms: undefined,
            status: undefined,
            actual_output: undefined,
            error_message: undefined,
            execution_time_ms: undefined,
            test_criteria: undefined,
        });
    };

    const handleTestCaseDelete = (deletedTestCaseId: number) => {
        // Clear the selected test case if it's the one being deleted
        if (selectedTestCase && selectedTestCase.id === deletedTestCaseId) {
            setSelectedTestCase(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-6xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Edit Test Suite: {testSuite.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Split Layout */}
                <div className="flex flex-col md:flex-row h-[60vh] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    {/* Left Panel - List of Test Cases */}
                    <TestSuiteEditListPanel
                        testCases={testCases}
                        selectedTestCase={selectedTestCase}
                        onTestCaseSelect={handleTestCaseSelect}
                        onTestCaseDelete={handleTestCaseDelete}
                        suiteId={testSuite.id}
                    />

                    {/* Right Panel - Test Case Details */}
                    <TestSuiteEditDetailPanel
                        selectedTestCase={selectedTestCase}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TestSuiteEdit;
