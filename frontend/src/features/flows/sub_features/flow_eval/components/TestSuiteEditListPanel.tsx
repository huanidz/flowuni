import React, { useState, useEffect } from 'react';
import type { DraftTestCase, FlowTestCase } from '../types';
import TestCaseCard from './TestCaseCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
    const createMutation = useCreateTestCase();

    const handleAdd = () => {
        setIsAdding(true);
        setDraft({ id: `draft-${Date.now()}`, name: '', isEditing: true });
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

    const handleDraftNameChange = (name: string) => {
        setDraft(prev => (prev ? { ...prev, name } : null));
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

                        {allItems.map(item => (
                            <TestCaseCard
                                key={
                                    typeof item.id === 'string'
                                        ? item.id
                                        : String(item.id)
                                }
                                item={item}
                                selectedTestCase={selectedTestCase}
                                onTestCaseSelect={onTestCaseSelect}
                                draft={draft}
                                setDraft={setDraft}
                                isCreating={createMutation.isPending}
                                onCreate={handleCreate}
                                onCancel={handleCancel}
                                onDraftNameChange={handleDraftNameChange}
                            />
                        ))}
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
