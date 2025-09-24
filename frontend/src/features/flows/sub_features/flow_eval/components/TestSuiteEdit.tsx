import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { TestCasePreview, FlowTestCase } from '../types';
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
    const [updatedTestCases, setUpdatedTestCases] = React.useState<
        FlowTestCase[]
    >([]);

    const handleClose = () => {
        // Clear the updated test cases when closing the modal
        setUpdatedTestCases([]);
        onClose();
    };

    const handleUpdateTestCase = (updatedTestCase: FlowTestCase) => {
        // Update the selected test case in the local state
        setSelectedTestCase(updatedTestCase);

        // Also update in the updatedTestCases array
        setUpdatedTestCases(prev => {
            const existingIndex = prev.findIndex(
                tc => tc.id === updatedTestCase.id
            );
            if (existingIndex >= 0) {
                const newUpdatedTestCases = [...prev];
                newUpdatedTestCases[existingIndex] = updatedTestCase;
                return newUpdatedTestCases;
            }
            return [...prev, updatedTestCase];
        });
    };

    const handleTestCaseSelect = async (testCase: TestCasePreview) => {
        if (selectedTestCase && selectedTestCase.id === testCase.id) {
            return;
        }

        try {
            setIsLoadingTestCase(true);

            // Check if we have updated data for this test case
            const updatedTestCase = updatedTestCases.find(
                tc => tc.id === testCase.id
            );

            if (updatedTestCase) {
                // Use the updated data instead of fetching from API
                setSelectedTestCase(updatedTestCase);
            } else {
                // Fetch the full test case data from the API
                const testCaseData = await getTestCase(testCase.id);

                // Convert TestCaseGetResponse to FlowTestCase for the detail panel
                setSelectedTestCase({
                    ...testCaseData,
                    pass_criteria: testCaseData.pass_criteria
                        ? {
                              rules: testCaseData.pass_criteria.rules || [],
                              logics: testCaseData.pass_criteria.logics || [],
                          }
                        : undefined,
                });
            }
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
                        onUpdateTestCase={handleUpdateTestCase}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TestSuiteEdit;
