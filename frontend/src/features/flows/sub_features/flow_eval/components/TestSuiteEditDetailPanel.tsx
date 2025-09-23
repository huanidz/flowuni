import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import getStatusBadge from '../utils';
import TestCriteriaBuilder from './RuleCriteria/TestCriteriaBuilder';
import { usePartialUpdateTestCase } from '../hooks';

interface TestSuiteEditDetailPanelProps {
    selectedTestCase: FlowTestCase | null;
    onUpdateTestCase?: (testCase: FlowTestCase) => void;
    isLoading?: boolean;
}

/**
 * Right panel component for displaying test case details in TestSuiteEdit modal
 */
const TestSuiteEditDetailPanel: React.FC<TestSuiteEditDetailPanelProps> = ({
    selectedTestCase,
    onUpdateTestCase,
    isLoading = false,
}) => {
    const [input, setInput] = useState(selectedTestCase?.input_text || '');
    const [testCriteria, setTestCriteria] = useState(
        JSON.stringify(selectedTestCase?.pass_criteria || {}, null, 2)
    );
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [name, setName] = useState(selectedTestCase?.name || '');
    const [description, setDescription] = useState(
        selectedTestCase?.description || ''
    );

    const partialUpdateTestCase = usePartialUpdateTestCase();

    // Update local state when selectedTestCase changes
    React.useEffect(() => {
        setInput(selectedTestCase?.input_text || '');
        setTestCriteria(
            JSON.stringify(selectedTestCase?.pass_criteria || {}, null, 2)
        );
        setName(selectedTestCase?.name || '');
        setDescription(selectedTestCase?.description || '');
        setIsEditingName(false);
        setIsEditingDescription(false);
    }, [selectedTestCase]);

    const handleFieldChange = (field: string, value: string) => {
        if (selectedTestCase && onUpdateTestCase) {
            try {
                if (field === 'input_text') {
                    // input_text is now a string, no need to parse
                    onUpdateTestCase({
                        ...selectedTestCase,
                        [field]: value,
                    });
                } else if (field === 'pass_criteria') {
                    const parsedValue = JSON.parse(value);
                    onUpdateTestCase({
                        ...selectedTestCase,
                        [field]: parsedValue,
                    });
                } else {
                    onUpdateTestCase({ ...selectedTestCase, [field]: value });
                }
            } catch (error) {
                console.error(`Error parsing ${field}:`, error);
                // Don't update if JSON is invalid
            }
        }
    };

    const handleNameSave = () => {
        if (selectedTestCase && name !== selectedTestCase.name) {
            partialUpdateTestCase.mutate({
                caseId: selectedTestCase.id,
                request: { name },
            });
            if (onUpdateTestCase) {
                onUpdateTestCase({ ...selectedTestCase, name });
            }
        }
        setIsEditingName(false);
    };

    const handleDescriptionSave = () => {
        if (selectedTestCase && description !== selectedTestCase.description) {
            partialUpdateTestCase.mutate({
                caseId: selectedTestCase.id,
                request: { description },
            });
            if (onUpdateTestCase) {
                onUpdateTestCase({ ...selectedTestCase, description });
            }
        }
        setIsEditingDescription(false);
    };

    const handleSave = () => {
        if (selectedTestCase) {
            try {
                // input is now a string, no need to parse
                const parsedCriteria = JSON.parse(testCriteria);

                // Update via API
                partialUpdateTestCase.mutate({
                    caseId: selectedTestCase.id,
                    request: {
                        input_text: input,
                        pass_criteria: parsedCriteria,
                    },
                });

                // Update local state
                if (onUpdateTestCase) {
                    onUpdateTestCase({
                        ...selectedTestCase,
                        input_text: input,
                        pass_criteria: parsedCriteria,
                    });
                }
            } catch (error) {
                console.error('Error saving test case:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 p-8 text-center flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Loading Test Case
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Fetching test case details...
                    </p>
                </div>
            </div>
        );
    }

    if (!selectedTestCase) {
        return (
            <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No Test Case Selected
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Select a test case from the list to view its details.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full md:w-2/3 overflow-y-auto bg-white dark:bg-slate-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        ID: {selectedTestCase.id}
                    </span>
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="text-xl font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
                                    autoFocus
                                />
                                <button
                                    onClick={handleNameSave}
                                    className="p-1 text-green-600 hover:text-green-700"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    className="p-1 text-red-600 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {name}
                                </h3>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(TestCaseStatus.PENDING)}
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        DESCRIPTION
                    </label>
                    {!isEditingDescription && (
                        <button
                            onClick={() => setIsEditingDescription(true)}
                            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {isEditingDescription ? (
                    <div className="space-y-2">
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Enter test case description..."
                            className="w-full h-24 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm resize-none"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditingDescription(false)}
                                className="px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDescriptionSave}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm min-h-[60px]">
                        {description || (
                            <span className="text-slate-500 dark:text-slate-400 italic">
                                No description provided
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    INPUT
                </label>
                <textarea
                    value={input as string}
                    onChange={e => {
                        setInput(e.target.value);
                        handleFieldChange('input_text', e.target.value);
                    }}
                    placeholder="Enter test input..."
                    className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none"
                />
            </div>

            {/* Test Pass Criteria - Rule Builder */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TEST PASS CRITERIA
                </label>
                <TestCriteriaBuilder
                    criteria={testCriteria as string}
                    onChange={criteria => {
                        setTestCriteria(criteria);
                        handleFieldChange('pass_criteria', criteria);
                    }}
                />
            </div>
        </div>
    );
};

export default TestSuiteEditDetailPanel;
