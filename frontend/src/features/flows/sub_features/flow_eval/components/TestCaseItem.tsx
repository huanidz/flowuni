import React from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import TestStatusIndicator from './TestStatusIndicator';

interface TestCaseItemProps {
    testCase: FlowTestCase;
    isSelected?: boolean;
    onSelect?: (testCaseId: string) => void;
    showSuiteName?: boolean;
    suiteName?: string;
}

/**
 * Component to display individual test case with status and details
 */
const TestCaseItem: React.FC<TestCaseItemProps> = ({
    testCase,
    isSelected = false,
    onSelect,
    showSuiteName = false,
    suiteName,
}) => {
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect(testCase.case_id);
        }
    };

    const formatExecutionTime = (ms?: number) => {
        if (!ms) return '';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div
            className={`
        p-2 border rounded hover:bg-gray-50 transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
      `}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {onSelect && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={handleCheckboxChange}
                            className="mt-0.5 flex-shrink-0"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                            <h4 className="text-xs font-medium truncate">
                                {testCase.name}
                            </h4>
                            {showSuiteName && suiteName && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">
                                    {suiteName}
                                </span>
                            )}
                        </div>

                        {testCase.description && (
                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                                {testCase.description}
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono text-xs opacity-75">
                                {testCase.case_id.substring(0, 8)}
                            </span>
                            {testCase.execution_time_ms && (
                                <span className="flex-shrink-0">
                                    {formatExecutionTime(
                                        testCase.execution_time_ms
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <TestStatusIndicator
                        status={testCase.status || TestCaseStatus.PENDING}
                        executionTimeMs={testCase.execution_time_ms}
                        showExecutionTime={false}
                    />
                </div>
            </div>

            {testCase.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="whitespace-pre-wrap break-words">
                        {testCase.error_message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestCaseItem;
