import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    useLLMJudges,
    useCreateLLMJudge,
    useUpdateLLMJudge,
    useDeleteLLMJudge,
} from '../hooks';
import LLMJudgeCard from './LLMJudgeCard';
import LLMJudgeForm from './LLMJudgeForm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import type {
    LLMJudge,
    CreateLLMJudgeRequest,
    UpdateLLMJudgeRequest,
} from '../types';

const LLMJudgesTab: React.FC = () => {
    const { data, isLoading, error } = useLLMJudges();
    const createLLMJudge = useCreateLLMJudge();
    const updateLLMJudge = useUpdateLLMJudge();
    const deleteLLMJudge = useDeleteLLMJudge();

    const [showForm, setShowForm] = useState(false);
    const [editingJudge, setEditingJudge] = useState<LLMJudge | null>(null);

    const handleCreate = () => {
        setEditingJudge(null);
        setShowForm(true);
    };

    const handleEdit = (llmJudge: LLMJudge) => {
        setEditingJudge(llmJudge);
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this LLM Judge?')) {
            deleteLLMJudge.mutate(id);
        }
    };

    const handleFormSave = (
        request: CreateLLMJudgeRequest | UpdateLLMJudgeRequest
    ) => {
        if (editingJudge) {
            updateLLMJudge.mutate({
                templateId: editingJudge.id,
                request: request as UpdateLLMJudgeRequest,
            });
        } else {
            createLLMJudge.mutate(request as CreateLLMJudgeRequest);
        }
        setShowForm(false);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingJudge(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading LLM Judges...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                Error loading LLM Judges: {error.message}
            </div>
        );
    }

    return (
        <div className="flex-1 p-4">
            {
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">LLM Judges</h2>
                    <Button
                        onClick={handleCreate}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Judge
                    </Button>
                </div>
            }

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingJudge
                                ? 'Edit LLM Judge'
                                : 'Create New LLM Judge'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure your LLM judge for evaluating responses
                        </DialogDescription>
                    </DialogHeader>
                    <LLMJudgeForm
                        llmJudge={editingJudge || undefined}
                        onSave={handleFormSave}
                        onCancel={handleFormCancel}
                        isLoading={
                            createLLMJudge.isPending || updateLLMJudge.isPending
                        }
                    />
                </DialogContent>
            </Dialog>

            {!showForm && (
                <>
                    {data?.templates && data.templates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.templates.map(judge => (
                                <LLMJudgeCard
                                    key={judge.id}
                                    llmJudge={judge}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                                No LLM Judges found
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LLMJudgesTab;
