import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import type { FlowTestCase } from '../types';
import TestCriteriaBuilder from './RuleCriteria/TestCriteriaBuilder';
import { usePartialUpdateTestCase } from '../hooks';
import EditableField from './TestSuiteEdit/EditableField';

interface TestSuiteEditDetailPanelProps {
    selectedTestCase: FlowTestCase | null;
    onUpdateTestCase?: (testCase: FlowTestCase) => void;
    isLoading?: boolean;
}

const TestSuiteEditDetailPanel: React.FC<TestSuiteEditDetailPanelProps> = ({
    selectedTestCase,
    onUpdateTestCase,
    isLoading = false,
}) => {
    const [input, setInput] = useState('');
    const [testCriteria, setTestCriteria] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const partialUpdateTestCase = usePartialUpdateTestCase();

    useEffect(() => {
        setInput(selectedTestCase?.input_text || '');
        setTestCriteria(
            JSON.stringify(
                selectedTestCase?.pass_criteria || { rules: [], logics: [] },
                null,
                2
            )
        );
        setName(selectedTestCase?.name || '');
        setNameDraft(selectedTestCase?.name || '');
        setDescription(selectedTestCase?.description || '');
    }, [selectedTestCase]);

    const updateCase = (field: string, value: any) => {
        if (!selectedTestCase || !onUpdateTestCase) return;
        try {
            const updated = {
                ...selectedTestCase,
                [field]: field === 'pass_criteria' ? JSON.parse(value) : value,
            };
            onUpdateTestCase(updated);
        } catch {
            console.error(`Error updating ${field}`);
        }
    };

    const saveField = (field: 'name' | 'description', value: string) => {
        if (!selectedTestCase || selectedTestCase[field] === value) return;
        partialUpdateTestCase.mutate({
            caseId: selectedTestCase.id,
            request: { [field]: value },
        });
        onUpdateTestCase?.({ ...selectedTestCase, [field]: value });
    };

    const handleNameEdit = () => {
        setNameDraft(name);
        setIsEditingName(true);
    };

    const handleNameSave = () => {
        if (nameDraft !== name) {
            saveField('name', nameDraft);
            setName(nameDraft);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setIsEditingName(false);
        setNameDraft(name);
    };

    const handleSave = () => {
        if (!selectedTestCase) return;
        try {
            const parsedCriteria = JSON.parse(testCriteria);
            partialUpdateTestCase.mutate({
                caseId: selectedTestCase.id,
                request: { input_text: input, pass_criteria: parsedCriteria },
            });
            onUpdateTestCase?.({
                ...selectedTestCase,
                input_text: input,
                pass_criteria: parsedCriteria,
            });
        } catch {
            console.error('Invalid testCriteria JSON');
        }
    };

    if (isLoading)
        return (
            <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Loading Test Case
                    </h3>
                    <p className="text-sm text-slate-500">
                        Fetching test case details...
                    </p>
                </div>
            </div>
        );

    if (!selectedTestCase)
        return (
            <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">
                    No Test Case Selected
                </h3>
                <p className="text-sm text-slate-500">
                    Select a test case to view details.
                </p>
            </div>
        );

    return (
        <div className="w-full md:w-2/3 overflow-y-auto bg-white dark:bg-slate-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        ID: {selectedTestCase.simple_id}
                    </span>
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nameDraft}
                                    onChange={e => setNameDraft(e.target.value)}
                                    className="text-xl font-bold px-2 py-1 rounded border bg-white dark:bg-slate-900"
                                    autoFocus
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleNameCancel}
                                        className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleNameSave}
                                        className="p-1 text-blue-600 hover:text-blue-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">
                                    {name || 'Unnamed Test Case'}
                                </h2>
                                <button
                                    onClick={handleNameEdit}
                                    className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={handleSave}
                >
                    Save
                </button>
            </div>

            <EditableField
                value={description}
                label="Description"
                placeholder="Enter test case description..."
                isMultiline
                onSave={val => saveField('description', val)}
            />

            {/* Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">INPUT</label>
                <textarea
                    value={input}
                    onChange={e => {
                        setInput(e.target.value);
                        updateCase('input_text', e.target.value);
                    }}
                    placeholder="Enter test input..."
                    className="w-full h-40 p-3 border rounded-md font-mono text-sm resize-none"
                />
            </div>
            {/* Criteria */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                    TEST PASS CRITERIA
                </label>
                <TestCriteriaBuilder
                    criteria={testCriteria}
                    onChange={criteria => {
                        setTestCriteria(criteria);
                        updateCase('pass_criteria', criteria);
                    }}
                />
            </div>
        </div>
    );
};

export default TestSuiteEditDetailPanel;
