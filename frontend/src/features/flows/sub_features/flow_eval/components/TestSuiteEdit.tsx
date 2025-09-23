import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type {
    TestCasePreview,
    FlowTestCase,
    TestCaseGetResponse,
} from '../types';
import { getTestCase } from '../api';
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
    const [isLoadingTestCase, setIsLoadingTestCase] = React.useState(false);

    const handleClose = () => {
        onClose();
    };

    const handleTestCaseSelect = async (testCase: TestCasePreview) => {
        try {
            setIsLoadingTestCase(true);
            // Fetch the full test case data from the API
            const testCaseData = await getTestCase(testCase.id);

            // Convert TestCaseGetResponse to FlowTestCase for the detail panel
            setSelectedTestCase({
                id: testCaseData.id,
                case_id: `case_${testCaseData.id}`, // Generate a case_id since it's required
                suite_id: testCaseData.suite_id,
                name: testCaseData.name,
                description: testCaseData.description,
                is_active: testCaseData.is_active,
                input_data: testCaseData.input_data,
                pass_criteria: testCaseData.pass_criteria,
                test_metadata: testCaseData.input_metadata, // Map input_metadata to test_metadata
                run_detail: undefined,
                timeout_ms: testCaseData.timeout_ms,
                status: undefined,
                actual_output: undefined,
                error_message: undefined,
                execution_time_ms: undefined,
                test_criteria: undefined,
            });
        } catch (error) {
            console.error('Error fetching test case:', error);
            // Handle error appropriately (e.g., show a toast notification)
        } finally {
            setIsLoadingTestCase(false);
        }
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
                        isLoading={isLoadingTestCase}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TestSuiteEdit;
