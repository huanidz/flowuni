import React, { useState } from 'react';
import type { TestCasePreview } from '../types';
import {
    useTestCaseStatus,
    useTaskIdForTestCase,
} from '../stores/testCaseStatusStore';
import { getTestRunStatusBadge } from '../utils';
import { Button } from '@/components/ui/button';
import { Play, ChevronDown, Square } from 'lucide-react';
import { useRunSingleTest, useCancelSingleTest } from '../hooks';
import { TestCaseRunStatus } from '../types';

interface TestCasePreviewItemProps {
    testCase: TestCasePreview;
    isSelected?: boolean;
    onSelect?: (testCaseId: string) => void;
    showSuiteName?: boolean;
    suiteName?: string;
    flowId: string;
}

/**
 * Component to display individual test case with status and details
 */
const TestCasePreviewItem: React.FC<TestCasePreviewItemProps> = ({
    testCase,
    isSelected = false,
    onSelect,
    showSuiteName = false,
    suiteName,
    flowId,
}) => {
    // Get the test case status from the Zustand store
    // The store status takes precedence over the API response status
    const storeStatus = useTestCaseStatus(String(testCase.id));
    const testCaseStatus =
        storeStatus !== 'PENDING'
            ? storeStatus
            : testCase.latest_run_status || 'PENDING';
    const runSingleTestMutation = useRunSingleTest();
    const cancelSingleTestMutation = useCancelSingleTest();

    // Get the task ID for this test case to use for cancellation
    const taskId = useTaskIdForTestCase(String(testCase.id));

    // Check if the test case is in a state that can be cancelled
    const isCancellable =
        testCaseStatus === TestCaseRunStatus.QUEUED ||
        testCaseStatus === TestCaseRunStatus.RUNNING;

    // State for expanded sections
    const [expandedSections, setExpandedSections] = useState({
        error: false,
        output: false,
    });

    // Toggle section expansion
    const toggleSection = (section: 'error' | 'output') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleSelect = () => {
        if (onSelect) {
            onSelect(String(testCase.id));
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        handleSelect();
    };

    const handleDivClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        handleSelect();
    };

    const handleRunTest = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection when clicking run

        runSingleTestMutation.mutate(
            {
                case_id: testCase.id,
                flow_id: flowId,
            },
            {
                onSuccess: data => {},
                onError: error => {
                    console.error(error);
                },
            }
        );
    };

    const handleCancelTest = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection when clicking cancel

        if (!taskId) {
            console.error('No task ID found for test case', testCase.id);
            return;
        }

        cancelSingleTestMutation.mutate(
            {
                task_id: taskId,
            },
            {
                onSuccess: data => {},
                onError: error => {
                    console.error(error);
                },
            }
        );
    };

    return (
        <div
            className={`
                p-3 border rounded transition-all duration-200 hover:shadow-sm
                ${
                    isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                }
            `}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={handleDivClick}
                >
                    {onSelect && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={handleCheckboxChange}
                            className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                CASE
                            </span>
                            <h4 className="text-sm font-medium truncate">
                                {testCase.name}
                            </h4>
                            {showSuiteName && suiteName && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                                    {suiteName}
                                </span>
                            )}
                        </div>

                        {testCase.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                                {testCase.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                <span className="text-gray-400">ID:</span>
                                <span className="text-gray-600">
                                    {String(testCase.simple_id)?.substring(
                                        0,
                                        18
                                    ) || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isCancellable ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                                        onClick={handleCancelTest}
                                        disabled={
                                            cancelSingleTestMutation.isPending
                                        }
                                    >
                                        <Square className="h-3 w-3" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                                        onClick={handleRunTest}
                                        disabled={
                                            runSingleTestMutation.isPending
                                        }
                                    >
                                        <Play className="h-3 w-3" />
                                    </Button>
                                )}
                                {getTestRunStatusBadge(testCaseStatus)}
                            </div>
                        </div>

                        {/* Display error message and chat output if available */}
                        {(testCase.latest_run_error_message ||
                            testCase.latest_run_chat_output) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                {testCase.latest_run_error_message && (
                                    <div
                                        className="mb-3 p-2 bg-red-50 rounded-md border border-red-100 cursor-pointer relative"
                                        onClick={() => toggleSection('error')}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                                                    Error
                                                </span>
                                            </div>
                                            <ChevronDown
                                                className={`h-3 w-3 text-red-600 transition-transform duration-200 ${expandedSections.error ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <div
                                            className={`relative ${expandedSections.error ? '' : 'max-h-12 overflow-hidden'}`}
                                        >
                                            <p className="text-xs text-red-600 break-words leading-relaxed">
                                                {
                                                    testCase.latest_run_error_message
                                                }
                                            </p>
                                            {!expandedSections.error && (
                                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-red-50 to-transparent"></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {testCase.latest_run_chat_output?.content && (
                                    <div
                                        className="p-2 bg-gray-50 rounded-md border border-gray-100 cursor-pointer relative"
                                        onClick={() => toggleSection('output')}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                                    Output
                                                </span>
                                            </div>
                                            <ChevronDown
                                                className={`h-3 w-3 text-gray-600 transition-transform duration-200 ${expandedSections.output ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <div
                                            className={`relative ${expandedSections.output ? '' : 'max-h-12 overflow-hidden'}`}
                                        >
                                            <p className="text-xs text-gray-600 break-words leading-relaxed">
                                                {
                                                    testCase
                                                        .latest_run_chat_output
                                                        .content
                                                }
                                            </p>
                                            {!expandedSections.output && (
                                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent"></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCasePreviewItem;
