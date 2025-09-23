import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { TestCasePreview } from '../types';
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
        React.useState<TestCasePreview | null>(
            testCases.length > 0 ? testCases[0] : null
        );

    const handleClose = () => {
        onClose();
    };

    const handleTestCaseSelect = (testCase: TestCasePreview) => {
        setSelectedTestCase(testCase);
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
