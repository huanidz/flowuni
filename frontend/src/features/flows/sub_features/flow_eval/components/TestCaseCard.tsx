import React, { useRef, useState, type KeyboardEvent } from 'react';
import type { DraftTestCase, TestCasePreview, FlowTestCase } from '../types';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CornerDownLeft, Trash2, Play, ChevronDown, X } from 'lucide-react';
import { useConfirmation } from '@/hooks/useConfirmationModal';
import {
    useDeleteTestCase,
    useRunSingleTest,
    useCancelSingleTest,
} from '../hooks';
import {
    useTestCaseStatus,
    useTaskIdForTestCase,
} from '../stores/testCaseStatusStore';
import { getTestRunStatusBadge } from '../utils';
import { TestCaseRunStatus } from '../types';

interface TestCaseCardProps {
    item: TestCasePreview | DraftTestCase;
    isSelected?: boolean;
    selectedTestCase?: FlowTestCase | null;
    onTestCaseSelect?: (testCase: TestCasePreview) => void;
    onTestCaseDelete?: (deletedTestCaseId: number) => void;
    draft?: DraftTestCase | null;
    isCreating?: boolean;
    onCreate?: () => void;
    onCancel?: () => void;
    onDraftNameChange?: (name: string) => void;
    flowId: string;
}

const TestCaseCard: React.FC<TestCaseCardProps> = ({
    item,
    isSelected = false,
    selectedTestCase = null,
    onTestCaseSelect,
    onTestCaseDelete,
    draft = null,
    isCreating = false,
    onCreate,
    onCancel,
    onDraftNameChange,
    flowId,
}) => {
    console.log('Item', item);
    const inputRef = useRef<HTMLInputElement>(null);
    const { confirm, ConfirmationDialog } = useConfirmation();
    const deleteTestCaseMutation = useDeleteTestCase();
    const runSingleTestMutation = useRunSingleTest();
    const cancelSingleTestMutation = useCancelSingleTest();

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

    const isDraft = typeof item.id === 'string' && item.id.startsWith('draft-');

    const handleDelete = (e: React.MouseEvent, testCase: TestCasePreview) => {
        e.stopPropagation(); // Prevent card selection when clicking delete

        confirm({
            title: 'Delete Test Case',
            description: `Are you sure you want to delete the test case "${testCase.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteTestCaseMutation.mutateAsync(testCase.id);
                onTestCaseDelete?.(testCase.id);
            },
        });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && draft?.name.trim() && onCreate) {
            onCreate();
        } else if (e.key === 'Escape' && onCancel) {
            onCancel();
        }
    };

    const handleRunTest = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection when clicking run

        const testCase = item as TestCasePreview;

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

    if (isDraft) {
        return (
            <Card
                key={item.id}
                className="border-primary"
                style={{ maxHeight: '100px' }}
            >
                <CardHeader className="p-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <Badge variant="outline">DRAFT</Badge>
                            <Input
                                ref={inputRef}
                                value={draft?.name || ''}
                                onChange={e =>
                                    onDraftNameChange?.(e.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Enter test case name..."
                                className="h-7 text-sm"
                                disabled={isCreating}
                            />
                        </div>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={onCreate}
                                disabled={!draft?.name.trim() || isCreating}
                            >
                                <CornerDownLeft className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={onCancel}
                                disabled={isCreating}
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    const testCase = item as TestCasePreview;
    const isItemSelected = String(selectedTestCase?.id) === String(testCase.id);

    // Get the test case status from the Zustand store or use the latest_run_status from the test case
    const storeStatus = useTestCaseStatus(String(testCase.id));
    const testCaseStatus = testCase.latest_run_status || storeStatus;

    // Get the task ID for this test case to use for cancellation
    const taskId = useTaskIdForTestCase(String(testCase.id));

    // Check if the test case is in a state that can be cancelled
    const isCancellable =
        testCaseStatus === TestCaseRunStatus.QUEUED ||
        testCaseStatus === TestCaseRunStatus.RUNNING;

    return (
        <>
            <Card
                key={String(testCase.id)}
                className={`cursor-pointer transition-colors ${
                    isItemSelected
                        ? 'border-primary bg-accent'
                        : 'hover:bg-accent/50'
                }`}
                onClick={() => onTestCaseSelect?.(testCase)}
            >
                <CardHeader className="p-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">CASE</Badge>
                                <h4 className="text-sm font-medium truncate">
                                    {testCase.name}
                                </h4>
                            </div>
                            <div className="flex items-center gap-2">
                                {isCancellable ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                                        onClick={handleCancelTest}
                                        disabled={
                                            cancelSingleTestMutation.isPending
                                        }
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600"
                                        onClick={handleRunTest}
                                        disabled={
                                            runSingleTestMutation.isPending
                                        }
                                    >
                                        <Play className="h-3 w-3" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={e => handleDelete(e, testCase)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getTestRunStatusBadge(testCaseStatus)}
                            </div>
                        </div>

                        {/* Display error message and chat output if available */}
                        {(testCase.latest_run_error_message ||
                            testCase.latest_run_chat_output) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
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
                </CardHeader>
            </Card>
            <ConfirmationDialog />
        </>
    );
};

export default TestCaseCard;
