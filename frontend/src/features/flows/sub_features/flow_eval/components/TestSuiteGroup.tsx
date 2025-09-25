import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { TestSuiteWithCasePreviews } from '../types';
import TestCasePreviewItem from './TestCasePreviewItem';
import TestSuiteEdit from './TestSuiteEdit';
import { useDeleteTestSuite } from '../hooks';
import { useConfirmation } from '@/hooks/useConfirmationModal';
import { useAllTestCaseStatuses } from '../stores/testCaseStatusStore';
import { getTestRunStatusBadge } from '../utils';
// Constants for test case display
const INITIAL_TEST_CASES_DISPLAYED = 3;
const TEST_CASE_THRESHOLD_FOR_BUTTONS = 3;

interface TestSuiteGroupProps {
    testSuite: TestSuiteWithCasePreviews;
    selectedTestCases: Set<string>;
    onTestCaseSelect: (testCaseId: string) => void;
    expandedSuites: Set<string>;
    onToggleExpand: (suiteId: string) => void;
}

/**
 * Component to display a test suite group with collapsible test cases
 */
const TestSuiteGroup: React.FC<TestSuiteGroupProps> = ({
    testSuite,
    selectedTestCases,
    onTestCaseSelect,
    expandedSuites,
    onToggleExpand,
}) => {
    const deleteTestSuiteMutation = useDeleteTestSuite();
    const isExpanded = expandedSuites.has(testSuite.id.toString());
    const { confirm, ConfirmationDialog } = useConfirmation();
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [showAllTestCases, setShowAllTestCases] = React.useState(false);

    // Get all test case statuses from the Zustand store
    const allTestCaseStatuses = useAllTestCaseStatuses();

    // Check if any test case in this suite is selected
    const hasSelectedTestCase = testSuite.test_cases.some(testCase =>
        selectedTestCases.has(String(testCase.id))
    );

    // Count selected test cases in this suite
    const selectedTestCaseCount = testSuite.test_cases.filter(testCase =>
        selectedTestCases.has(String(testCase.id))
    ).length;

    // Calculate suite statistics
    const totalTests = testSuite.test_cases.length;

    // Calculate status counts for this suite
    const statusCounts = testSuite.test_cases.reduce(
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

    const toggleExpand = () => {
        onToggleExpand(testSuite.id.toString());
    };

    return (
        <>
            <div
                className={`border rounded transition-all duration-300 ${
                    hasSelectedTestCase
                        ? 'bg-blue-50'
                        : isExpanded
                          ? 'bg-gray-50'
                          : 'bg-white'
                }`}
            >
                {/* Suite Header */}
                <div className="p-3 cursor-pointer" onClick={toggleExpand}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button
                                    className={`p-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                >
                                    <svg
                                        className="w-3 h-3 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                                <h3 className="text-sm font-medium flex items-center gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                        SUITE
                                    </span>
                                    <span>{testSuite.name}</span>
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {totalTests}{' '}
                                        {totalTests === 1 ? 'case' : 'cases'}
                                    </span>
                                    {getTestRunStatusBadge(suiteStatus)}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Action Buttons with Text */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 text-xs"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setIsEditModalOpen(true);
                                    }}
                                    title="Edit test suite"
                                >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs"
                                    onClick={e => {
                                        e.stopPropagation();
                                        confirm({
                                            title: 'Delete Test Suite',
                                            description: `Are you sure you want to delete the test suite "${testSuite.name}"? This action cannot be undone.`,
                                            confirmText: 'Delete',
                                            cancelText: 'Cancel',
                                            variant: 'destructive',
                                            onConfirm: () => {
                                                deleteTestSuiteMutation.mutate({
                                                    suiteId: testSuite.id,
                                                    flowId: testSuite.flow_id,
                                                });
                                            },
                                        });
                                    }}
                                    title="Delete test suite"
                                    disabled={deleteTestSuiteMutation.isPending}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start justify-between mt-1">
                        {testSuite.description && (
                            <p className="text-xs text-gray-600">
                                {testSuite.description}
                            </p>
                        )}
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-xs font-medium transition-opacity duration-200 ${
                                    selectedTestCaseCount > 0
                                        ? 'text-blue-600 opacity-100 bg-blue-100 px-2 py-0.5 rounded-full'
                                        : 'opacity-0'
                                }`}
                            >
                                {selectedTestCaseCount > 0
                                    ? `${selectedTestCaseCount} selected`
                                    : '0 selected'}
                            </span>

                            {/* Status summary badges */}
                            {Object.entries(statusCounts).map(
                                ([status, count]) =>
                                    count > 0 && (
                                        <span
                                            key={status}
                                            className="text-xs opacity-80"
                                        >
                                            {count} {status.toLowerCase()}
                                        </span>
                                    )
                            )}
                        </div>
                    </div>
                </div>

                {/* Test Cases - Tree Style */}
                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        isExpanded
                            ? 'max-h-[2000px] opacity-100'
                            : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="border-t relative">
                        {/* Tree connector line */}
                        {isExpanded && (
                            <div
                                className="absolute left-4 top-0 w-px h-full bg-gray-300"
                                style={{ height: `calc(100% - 0.5rem)` }}
                            />
                        )}

                        <div className="p-1 space-y-1">
                            {testSuite.test_cases
                                .slice(
                                    0,
                                    showAllTestCases ||
                                        testSuite.test_cases.length <=
                                            TEST_CASE_THRESHOLD_FOR_BUTTONS
                                        ? testSuite.test_cases.length
                                        : INITIAL_TEST_CASES_DISPLAYED
                                )
                                .map((testCase, index) => (
                                    <div
                                        key={String(testCase.id)}
                                        className="relative flex items-start"
                                    >
                                        {/* Horizontal connector line */}
                                        {isExpanded && (
                                            <div className="absolute left-4 top-4 w-4 h-px bg-gray-300" />
                                        )}

                                        {/* Tree item with indentation */}
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

                            {/* Show More/Show All buttons when there are more than 3 test cases */}
                            {testSuite.test_cases.length >
                                TEST_CASE_THRESHOLD_FOR_BUTTONS && (
                                <div className="pl-8 pt-1 flex items-center gap-2">
                                    {!showAllTestCases && (
                                        <span className="text-xs text-gray-500">
                                            {testSuite.test_cases.length -
                                                INITIAL_TEST_CASES_DISPLAYED}{' '}
                                            more
                                        </span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
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
