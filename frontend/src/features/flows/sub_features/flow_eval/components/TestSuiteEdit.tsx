import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { TestCasePreview, FlowTestCase } from '../types';
import { getTestCase } from '../api';
import TestSuiteEditListPanel from './TestSuiteEditListPanel';
import TestSuiteEditDetailPanel from './TestSuiteEditDetailPanel';
import { useAllTestCaseStatuses } from '../stores/testCaseStatusStore';
import { getTestRunStatusBadge } from '../utils';

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

    // Get all test case statuses from the Zustand store
    const allTestCaseStatuses = useAllTestCaseStatuses();

    // Calculate status counts for this suite
    const statusCounts = testCases.reduce(
        (acc, testCase) => {
            const status =
                allTestCaseStatuses[String(testCase.id)] || 'PENDING';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    // Determine the overall suite status based on test case statuses
    const getSuiteStatus = () => {
        const totalTests = testCases.length;
        if (totalTests === 0) return 'PENDING';

        // If any test is running, the suite is running
        if (statusCounts['RUNNING'] > 0) return 'RUNNING';

        // If any test is queued, the suite is queued
        if (statusCounts['QUEUED'] > 0) return 'QUEUED';

        // If all tests passed, the suite passed
        if (statusCounts['PASSED'] === totalTests) return 'PASSED';

        // If any test failed, the suite failed
        if (statusCounts['FAILED'] > 0) return 'FAILED';

        // If any test has a system error, the suite has a system error
        if (statusCounts['SYSTEM_ERROR'] > 0) return 'SYSTEM_ERROR';

        // If any test was cancelled, the suite was cancelled
        if (statusCounts['CANCELLED'] > 0) return 'CANCELLED';

        // Default to pending
        return 'PENDING';
    };

    const suiteStatus = getSuiteStatus();

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
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold">
                            Edit Test Suite: {testSuite.name}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {getTestRunStatusBadge(suiteStatus)}
                            <Badge variant="outline" className="text-xs">
                                {testCases.length}{' '}
                                {testCases.length === 1 ? 'case' : 'cases'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(statusCounts).map(
                            ([status, count]) =>
                                count > 0 && (
                                    <Badge
                                        key={status}
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {count} {status.toLowerCase()}
                                    </Badge>
                                )
                        )}
                    </div>
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
