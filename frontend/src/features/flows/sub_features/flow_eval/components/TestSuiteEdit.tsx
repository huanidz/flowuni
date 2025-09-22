import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { FlowTestCase } from '../types';
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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-6xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Edit Test Suite: {testSuite.name}</DialogTitle>
                </DialogHeader>

                {/* Split Layout */}
                <div className="flex flex-col md:flex-row h-[60vh] border rounded-lg overflow-hidden gap-4 p-4">
                    {/* Left Panel - List of Test Cases */}
                    <TestSuiteEditListPanel
                        testCases={testCases}
                        selectedTestCase={selectedTestCase}
                        onTestCaseSelect={handleTestCaseSelect}
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
