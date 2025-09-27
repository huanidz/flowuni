import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronRight } from 'lucide-react';
import type { TestSuiteWithCasePreviews } from '../types';
import TestCasePreviewItem from './TestCasePreviewItem';
import TestSuiteEdit from './TestSuiteEdit';
import { useDeleteTestSuite } from '../hooks';
import { useConfirmation } from '@/hooks/useConfirmationModal';
import { useAllTestCaseStatuses } from '../stores/testCaseStatusStore';
import { getTestRunStatusBadge } from '../utils';

const INITIAL_TEST_CASES_DISPLAYED = 3;
const TEST_CASE_THRESHOLD = 3;

interface TestSuiteGroupProps {
    testSuite: TestSuiteWithCasePreviews;
    selectedTestCases: Set<string>;
    onTestCaseSelect: (testCaseId: string) => void;
    expandedSuites: Set<string>;
    onToggleExpand: (suiteId: string) => void;
}

const TestSuiteGroup: React.FC<TestSuiteGroupProps> = ({
    testSuite,
    selectedTestCases,
    onTestCaseSelect,
    expandedSuites,
    onToggleExpand,
}) => {
    const deleteTestSuiteMutation = useDeleteTestSuite();
    const { confirm, ConfirmationDialog } = useConfirmation();
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [showAllTestCases, setShowAllTestCases] = React.useState(false);

    const allTestCaseStatuses = useAllTestCaseStatuses();
    const isExpanded = expandedSuites.has(testSuite.id.toString());

    // Calculate derived values
    const selectedTestCasesInSuite = testSuite.test_cases.filter(tc =>
        selectedTestCases.has(String(tc.id))
    );
    const hasSelectedTestCase = selectedTestCasesInSuite.length > 0;
    const totalTests = testSuite.test_cases.length;

    // Status counts and suite status
    const statusCounts = testSuite.test_cases.reduce(
        (acc, testCase) => {
            const status =
                allTestCaseStatuses[String(testCase.id)] || 'PENDING';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    const getSuiteStatus = () => {
        if (totalTests === 0 || statusCounts.RUNNING > 0)
            return statusCounts.RUNNING > 0 ? 'RUNNING' : 'PENDING';
        if (statusCounts.QUEUED > 0) return 'QUEUED';
        if (statusCounts.PASSED === totalTests) return 'PASSED';
        if (statusCounts.FAILED > 0) return 'FAILED';
        if (statusCounts.SYSTEM_ERROR > 0) return 'SYSTEM_ERROR';
        if (statusCounts.CANCELLED > 0) return 'CANCELLED';
        return 'PENDING';
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        confirm({
            title: 'Delete Test Suite',
            description: `Are you sure you want to delete "${testSuite.name}"? This cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'destructive',
            onConfirm: () =>
                deleteTestSuiteMutation.mutate({
                    suiteId: testSuite.id,
                    flowId: testSuite.flow_id,
                }),
        });
    };

    const displayedTestCases =
        showAllTestCases || totalTests <= TEST_CASE_THRESHOLD
            ? testSuite.test_cases
            : testSuite.test_cases.slice(0, INITIAL_TEST_CASES_DISPLAYED);

    const containerClass = `border rounded transition-colors ${
        hasSelectedTestCase
            ? 'bg-blue-50'
            : isExpanded
              ? 'bg-gray-50'
              : 'bg-white'
    }`;

    return (
        <>
            <div className={containerClass}>
                {/* Suite Header */}
                <div
                    className="p-3 cursor-pointer"
                    onClick={() => onToggleExpand(testSuite.id.toString())}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ChevronRight
                                className={`w-4 h-4 text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                }`}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded">
                                    SUITE
                                </span>
                                <h3 className="text-sm font-medium">
                                    {testSuite.name}
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {totalTests}{' '}
                                    {totalTests === 1 ? 'case' : 'cases'}
                                </span>
                                {getTestRunStatusBadge(getSuiteStatus())}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                                onClick={e => {
                                    e.stopPropagation();
                                    setIsEditModalOpen(true);
                                }}
                            >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                                onClick={handleDelete}
                                disabled={deleteTestSuiteMutation.isPending}
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mt-1">
                        {testSuite.description && (
                            <p className="text-xs text-gray-600">
                                {testSuite.description}
                            </p>
                        )}
                        <div className="flex items-center gap-2">
                            {selectedTestCasesInSuite.length > 0 && (
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                    {selectedTestCasesInSuite.length} selected
                                </span>
                            )}
                            {Object.entries(statusCounts).map(
                                ([status, count]) =>
                                    count > 0 && (
                                        <span
                                            key={status}
                                            className="text-xs text-gray-500"
                                        >
                                            {count} {status.toLowerCase()}
                                        </span>
                                    )
                            )}
                        </div>
                    </div>
                </div>

                {/* Test Cases */}
                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        isExpanded
                            ? 'max-h-[2000px] opacity-100'
                            : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="border-t relative">
                        {isExpanded && (
                            <div className="absolute left-4 top-0 w-px h-full bg-gray-300" />
                        )}

                        <div className="p-1 space-y-1">
                            {displayedTestCases.map(testCase => (
                                <div
                                    key={String(testCase.id)}
                                    className="relative flex items-start"
                                >
                                    {isExpanded && (
                                        <div className="absolute left-4 top-4 w-4 h-px bg-gray-300" />
                                    )}
                                    <div className="pl-8 flex-1">
                                        <TestCasePreviewItem
                                            testCase={testCase}
                                            isSelected={selectedTestCases.has(
                                                String(testCase.id)
                                            )}
                                            onSelect={onTestCaseSelect}
                                            suiteName={testSuite.name}
                                            showSuiteName={false}
                                        />
                                    </div>
                                </div>
                            ))}

                            {totalTests > TEST_CASE_THRESHOLD && (
                                <div className="pl-8 pt-1 flex items-center gap-2">
                                    {!showAllTestCases && (
                                        <span className="text-xs text-gray-500">
                                            {totalTests -
                                                INITIAL_TEST_CASES_DISPLAYED}{' '}
                                            more
                                        </span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() =>
                                            setShowAllTestCases(
                                                !showAllTestCases
                                            )
                                        }
                                    >
                                        {showAllTestCases
                                            ? 'Show Less'
                                            : 'Show All'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <TestSuiteEdit
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                testSuite={{
                    id: testSuite.id,
                    suite_id: testSuite.id.toString(),
                    name: testSuite.name,
                    description: testSuite.description,
                    flow_id: testSuite.flow_id,
                }}
                testCases={testSuite.test_cases}
            />

            <ConfirmationDialog />
        </>
    );
};

export default TestSuiteGroup;
