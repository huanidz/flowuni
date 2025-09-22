import React, { useState } from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';
import TestCriteriaBuilder from './TestCriteriaBuilder';

interface TestSuiteEditDetailPanelProps {
    selectedTestCase: FlowTestCase | null;
    onUpdateTestCase?: (testCase: FlowTestCase) => void;
}

/**
 * Right panel component for displaying test case details in TestSuiteEdit modal
 */
const TestSuiteEditDetailPanel: React.FC<TestSuiteEditDetailPanelProps> = ({
    selectedTestCase,
    onUpdateTestCase,
}) => {
    const [description, setDescription] = useState(
        selectedTestCase?.description || ''
    );
    const [input, setInput] = useState(selectedTestCase?.input || '');
    const [expectedOutput, setExpectedOutput] = useState(
        selectedTestCase?.expected_output || ''
    );
    const [testCriteria, setTestCriteria] = useState(
        selectedTestCase?.test_criteria || ''
    );

    // Update local state when selectedTestCase changes
    React.useEffect(() => {
        setDescription(selectedTestCase?.description || '');
        setInput(selectedTestCase?.input || '');
        setExpectedOutput(selectedTestCase?.expected_output || '');
        setTestCriteria(selectedTestCase?.test_criteria || '');
    }, [selectedTestCase]);

    const handleFieldChange = (field: string, value: string) => {
        if (selectedTestCase && onUpdateTestCase) {
            onUpdateTestCase({ ...selectedTestCase, [field]: value });
        }
    };

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
                        ID: {selectedTestCase.case_id}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {selectedTestCase.name}
                    </h3>
                </div>
                {getStatusBadge(
                    selectedTestCase.status || TestCaseStatus.PENDING
                )}
            </div>

            {/* Two-Column Layout for Input and Expected Output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        INPUT
                    </label>
                    <textarea
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            handleFieldChange('input', e.target.value);
                        }}
                        placeholder="Enter test input..."
                        className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none"
                    />
                </div>

                {/* Expected Output */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        EXPECTED OUTPUT
                    </label>
                    <textarea
                        value={expectedOutput}
                        onChange={e => {
                            setExpectedOutput(e.target.value);
                            handleFieldChange(
                                'expected_output',
                                e.target.value
                            );
                        }}
                        placeholder="Enter expected output..."
                        className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none"
                    />
                </div>
            </div>

            {/* Test Pass Criteria - Rule Builder */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TEST PASS CRITERIA
                </label>
                <TestCriteriaBuilder
                    criteria={testCriteria}
                    onChange={criteria => {
                        setTestCriteria(criteria);
                        handleFieldChange('test_criteria', criteria);
                    }}
                />
            </div>

            {/* Bottom Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <span>Description:</span>
                    <input
                        type="text"
                        value={description}
                        onChange={e => {
                            setDescription(e.target.value);
                            handleFieldChange('description', e.target.value);
                        }}
                        placeholder="Optional description"
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm w-48"
                    />
                </div>

                {selectedTestCase.execution_time_ms && (
                    <div>
                        <span>Execution Time: </span>
                        <span className="font-mono">
                            {selectedTestCase.execution_time_ms}ms
                        </span>
                    </div>
                )}

                {selectedTestCase.error_message && (
                    <div className="flex-1">
                        <span className="text-red-600 dark:text-red-400">
                            Error:{' '}
                        </span>
                        <span className="font-mono text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            {selectedTestCase.error_message}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSuiteEditDetailPanel;
