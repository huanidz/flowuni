import React, { useState } from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import getStatusBadge from '../utils';
import TestCriteriaBuilder from './RuleCriteria/TestCriteriaBuilder';

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

    // Update local state when selectedTestCase changes
    React.useEffect(() => {
        setInput(selectedTestCase?.input_text || '');
        setTestCriteria(
            JSON.stringify(selectedTestCase?.pass_criteria || {}, null, 2)
        );
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

    const handleSave = () => {
        if (selectedTestCase && onUpdateTestCase) {
            try {
                // input is now a string, no need to parse
                const parsedCriteria = JSON.parse(testCriteria);
                onUpdateTestCase({
                    ...selectedTestCase,
                    input_text: input,
                    pass_criteria: parsedCriteria,
                });
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
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {selectedTestCase.name}
                    </h3>
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
