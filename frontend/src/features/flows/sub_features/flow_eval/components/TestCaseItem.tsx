import React from 'react';
import type { TestCasePreview } from '../types';
import { TestCaseStatus } from '../types';
import { getStatusBadge } from '../utils';

interface TestCaseItemProps {
    testCase: TestCasePreview;
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
            onSelect(String(testCase.id));
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
                                    {String(testCase.id)?.substring(0, 8) ||
                                        'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(TestCaseStatus.PENDING)}
                </div>
            </div>
        </div>
    );
};

export default TestCaseItem;
