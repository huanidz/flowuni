import React from 'react';
import type { FlowTestCase } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';

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
    const handleSelect = () => {
        if (onSelect) {
            onSelect(testCase.case_id);
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        handleSelect();
    };

    const handleDivClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        handleSelect();
    };

    const formatExecutionTime = (ms?: number) => {
        if (!ms) return '';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div
            className={`
                p-3 border rounded transition-all duration-200 hover:shadow-sm
                ${
                    isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                }
            `}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={handleDivClick}
                >
                    {onSelect && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={handleCheckboxChange}
                            className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                CASE
                            </span>
                            <h4 className="text-sm font-medium truncate">
                                {testCase.name}
                            </h4>
                            {showSuiteName && suiteName && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                                    {suiteName}
                                </span>
                            )}
                        </div>

                        {testCase.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                                {testCase.description}
                            </p>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                <span className="text-gray-400">ID:</span>
                                <span className="text-gray-600">
                                    {testCase.case_id?.substring(0, 8) || 'N/A'}
                                </span>
                            </div>
                            {testCase.execution_time_ms && (
                                <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                    <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {formatExecutionTime(
                                        testCase.execution_time_ms
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(testCase.status || TestCaseStatus.PENDING)}
                </div>
            </div>

            {testCase.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                            <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                            ERROR
                        </div>
                    </div>
                    <div className="text-xs text-red-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                        {testCase.error_message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestCaseItem;
