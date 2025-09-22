import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { DraftTestCase, FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CornerDownLeft } from 'lucide-react';
import { useCreateTestCase } from '../hooks';

interface TestSuiteEditListPanelProps {
    testCases: FlowTestCase[];
    selectedTestCase: FlowTestCase | null;
    onTestCaseSelect: (testCase: FlowTestCase) => void;
    suiteId: number;
}

const TestSuiteEditListPanel: React.FC<TestSuiteEditListPanelProps> = ({
    testCases,
    selectedTestCase,
    onTestCaseSelect,
    suiteId,
}) => {
    const [draft, setDraft] = useState<DraftTestCase | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const createMutation = useCreateTestCase();

    useEffect(() => {
        if (draft && inputRef.current) inputRef.current.focus();
    }, [draft]);

    const handleAdd = () => {
        setIsAdding(true);
        setDraft({ id: `draft-${Date.now()}`, name: '', isEditing: true });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && draft?.name.trim()) handleCreate();
        else if (e.key === 'Escape') handleCancel();
    };

    const handleCreate = () => {
        if (draft?.name.trim()) {
            createMutation.mutate(
                { suite_id: suiteId, name: draft.name.trim() },
                { onSuccess: handleCancel }
            );
        }
    };

    const handleCancel = () => {
        setDraft(null);
        setIsAdding(false);
    };

    const allItems = [...testCases, ...(draft ? [draft] : [])];

    return (
        <div className="w-full md:w-1/3 border-r flex flex-col bg-background">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Test Cases</h3>
                    <Badge variant="secondary">{testCases.length}</Badge>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {testCases.length === 0 && !draft ? (
                    <div className="p-8 text-center m-4 border rounded">
                        <h3 className="text-lg font-semibold mb-2">
                            No Test Cases Available
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Create test cases to validate your flow
                            functionality.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                            <span>TEST CASES</span>
                            <div className="flex-1 h-px bg-border" />
                            <span>{allItems.length} items</span>
                        </div>

                        {allItems.map(item => {
                            const isDraft =
                                typeof item.id === 'string' &&
                                item.id.startsWith('draft-');

                            if (isDraft) {
                                return (
                                    <Card
                                        key={item.id}
                                        className="border-primary"
                                    >
                                        <CardHeader className="p-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Badge variant="outline">
                                                        DRAFT
                                                    </Badge>
                                                    <Input
                                                        ref={inputRef}
                                                        value={
                                                            draft?.name || ''
                                                        }
                                                        onChange={e =>
                                                            setDraft(prev =>
                                                                prev
                                                                    ? {
                                                                          ...prev,
                                                                          name: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : null
                                                            )
                                                        }
                                                        onKeyDown={
                                                            handleKeyDown
                                                        }
                                                        placeholder="Enter test case name..."
                                                        className="h-7 text-sm"
                                                        disabled={
                                                            createMutation.isPending
                                                        }
                                                    />
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0"
                                                        onClick={handleCreate}
                                                        disabled={
                                                            !draft?.name.trim() ||
                                                            createMutation.isPending
                                                        }
                                                    >
                                                        <CornerDownLeft className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0"
                                                        onClick={handleCancel}
                                                        disabled={
                                                            createMutation.isPending
                                                        }
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                );
                            }

                            const testCase = item as FlowTestCase;
                            const isSelected =
                                String(selectedTestCase?.case_id) ===
                                String(testCase.case_id);

                            return (
                                <Card
                                    key={String(testCase.case_id)}
                                    className={`cursor-pointer transition-colors ${
                                        isSelected
                                            ? 'border-primary bg-accent'
                                            : 'hover:bg-accent/50'
                                    }`}
                                    onClick={() => onTestCaseSelect(testCase)}
                                >
                                    <CardHeader className="p-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    CASE
                                                </Badge>
                                                <h4 className="text-sm font-medium truncate">
                                                    {testCase.name}
                                                </h4>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {getStatusBadge(
                                                    testCase.status ||
                                                        TestCaseStatus.PENDING
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 border-t">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAdd}
                    disabled={isAdding}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add test case
                </Button>
            </div>
        </div>
    );
};

export default TestSuiteEditListPanel;
