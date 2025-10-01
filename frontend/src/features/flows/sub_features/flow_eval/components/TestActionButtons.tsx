import React from 'react';
import type { TestStatistics } from '../types';

interface TestActionButtonsProps {
    statistics: TestStatistics;
    selectedCount: number;
    runningCount: number;
    onRunAll: () => void;
    onRunFailed: () => void;
    onRunSelected: () => void;
    onCancelRunning: () => void;
}

/**
 * Component with the three main test execution action buttons
 */
const TestActionButtons: React.FC<TestActionButtonsProps> = ({
    statistics,
    selectedCount,
    runningCount,
    onRunAll,
    onRunFailed,
    onRunSelected,
    onCancelRunning,
}) => {
    const hasFailedTests = statistics.failed > 0;
    const hasSelectedTests = selectedCount > 0;
    const hasRunningTests = runningCount > 0;

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-t">
            {/* Run All Tests Button */}
            <button
                onClick={onRunAll}
                disabled={statistics.total === 0}
                className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${
              statistics.total === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
        `}
            >
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-2"
                    />
                </svg>
                {`Run All (${statistics.total})`}
            </button>

            {/* Run Failed Tests Button */}
            <button
                onClick={onRunFailed}
                disabled={!hasFailedTests}
                className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${
              !hasFailedTests
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
          }
        `}
            >
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
                {`Run Failed (${statistics.failed})`}
            </button>

            {/* Run Selected Tests Button */}
            <button
                onClick={onRunSelected}
                disabled={!hasSelectedTests}
                className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${
              !hasSelectedTests
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
          }
        `}
            >
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
                {`Run Selected (${selectedCount})`}
            </button>

            {/* Cancel Running Tests Button */}
            <button
                onClick={onCancelRunning}
                disabled={!hasRunningTests}
                className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${
              !hasRunningTests
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
          }
        `}
            >
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
                {`Cancel Running (${runningCount})`}
            </button>
        </div>
    );
};

export default TestActionButtons;
