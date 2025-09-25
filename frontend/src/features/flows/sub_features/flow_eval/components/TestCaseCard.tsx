import React, { useRef, useState, type KeyboardEvent } from 'react';
import type { DraftTestCase, TestCasePreview, FlowTestCase } from '../types';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CornerDownLeft, Trash2, Play } from 'lucide-react';
import { useConfirmation } from '@/hooks/useConfirmationModal';
import {
    useDeleteTestCase,
    useRunSingleTest,
    useWatchFlowTestEvents,
} from '../hooks';
import { useTestCaseStatus } from '../stores/testCaseStatusStore';
import { getTestRunStatusBadge } from '../utils';

interface TestCaseCardProps {
    item: TestCasePreview | DraftTestCase;
    isSelected?: boolean;
    selectedTestCase?: FlowTestCase | null;
    onTestCaseSelect?: (testCase: TestCasePreview) => void;
    onTestCaseDelete?: (deletedTestCaseId: number) => void;
    draft?: DraftTestCase | null;
    setDraft?: (draft: DraftTestCase | null) => void;
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
    setDraft,
    isCreating = false,
    onCreate,
    onCancel,
    onDraftNameChange,
    flowId,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { confirm, ConfirmationDialog } = useConfirmation();
    const deleteTestCaseMutation = useDeleteTestCase();
    const runSingleTestMutation = useRunSingleTest();
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    const isDraft = typeof item.id === 'string' && item.id.startsWith('draft-');

    // Use the SSE hook to watch for events when we have a task ID
    useWatchFlowTestEvents(currentTaskId);

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

        runSingleTestMutation.mutate(
            {
                case_id: testCase.id,
                flow_id: flowId,
            },
            {
                onSuccess: data => {
                    // Set the task ID to start watching for SSE events
                    setCurrentTaskId(data.task_id);

                    console.log(
                        'Test run started, watching for events with task ID:',
                        data.task_id
                    );
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

    // Get the test case status from the Zustand store
    const testCaseStatus = useTestCaseStatus(String(testCase.id));

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
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600"
                                    onClick={handleRunTest}
                                    disabled={runSingleTestMutation.isPending}
                                >
                                    <Play className="h-3 w-3" />
                                </Button>
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
                    </div>
                </CardHeader>
            </Card>
            <ConfirmationDialog />
        </>
    );
};

export default TestCaseCard;
