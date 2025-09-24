import React, { useState } from 'react';
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

const TestSuiteEdit: React.FC<TestSuiteEditProps> = ({
    isOpen,
    onClose,
    testSuite,
    testCases = [],
}) => {
    const [selectedTestCase, setSelectedTestCase] =
        useState<FlowTestCase | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [updatedCases, setUpdatedCases] = useState<FlowTestCase[]>([]);

    const handleClose = () => {
        setUpdatedCases([]);
        onClose();
    };

    const handleUpdateTestCase = (updated: FlowTestCase) => {
        setSelectedTestCase(updated);
        setUpdatedCases(prev =>
            prev.some(tc => tc.id === updated.id)
                ? prev.map(tc => (tc.id === updated.id ? updated : tc))
                : [...prev, updated]
        );
    };

    const handleTestCaseSelect = async (testCase: TestCasePreview) => {
        if (selectedTestCase?.id === testCase.id) return;

        setIsLoading(true);
        try {
            const localUpdate = updatedCases.find(tc => tc.id === testCase.id);
            if (localUpdate) {
                setSelectedTestCase(localUpdate);
            } else {
                const data = await getTestCase(testCase.id);
                setSelectedTestCase({
                    ...data,
                    pass_criteria: data.pass_criteria
                        ? {
                              rules: data.pass_criteria.rules || [],
                              logics: data.pass_criteria.logics || [],
                          }
                        : undefined,
                });
            }
        } catch (err) {
            console.error('Error fetching test case:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestCaseDelete = (deletedId: number) => {
        if (selectedTestCase?.id === deletedId) setSelectedTestCase(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-6xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Edit Test Suite: {testSuite.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-[60vh] bg-slate-50 dark:bg-slate-900 border rounded-lg overflow-hidden">
                    <TestSuiteEditListPanel
                        testCases={testCases}
                        selectedTestCase={selectedTestCase}
                        onTestCaseSelect={handleTestCaseSelect}
                        onTestCaseDelete={handleTestCaseDelete}
                        suiteId={testSuite.id}
                        flowId={testSuite.flow_id}
                    />
                    <TestSuiteEditDetailPanel
                        selectedTestCase={selectedTestCase}
                        isLoading={isLoading}
                        onUpdateTestCase={handleUpdateTestCase}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TestSuiteEdit;
