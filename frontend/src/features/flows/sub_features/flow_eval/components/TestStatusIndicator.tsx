import React from 'react';
import { TestCaseStatus } from '../types';
import { TEST_STATUS_COLORS } from '../const';

interface TestStatusIndicatorProps {
    status: TestCaseStatus;
    executionTimeMs?: number;
    showExecutionTime?: boolean;
}

/**
 * Component to display test case execution status with visual indicators
 */
const TestStatusIndicator: React.FC<TestStatusIndicatorProps> = ({
    status,
    executionTimeMs,
    showExecutionTime = false,
}) => {
    const getStatusIcon = () => {
        switch (status) {
            case TestCaseStatus.PENDING:
                return (
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm" />
                );
            case TestCaseStatus.QUEUED:
                return (
                    <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                );
            case TestCaseStatus.RUNNING:
                return (
                    <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-sm animate-pulse" />
                );
            case TestCaseStatus.PASSED:
                return (
                    <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm">
                        <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <path
                                d="M2.3 4L3.5 5.2L5.7 2.8"
                                stroke="white"
                                strokeWidth="1"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                );
            case TestCaseStatus.FAILED:
                return (
                    <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-white shadow-sm">
                        <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <path
                                d="M2 2L6 6M6 2L2 6"
                                stroke="white"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                );
            case TestCaseStatus.CANCEL:
                return (
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm">
                        <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <path
                                d="M2 4H6"
                                stroke="white"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-sm" />
                );
        }
    };

    const getStatusText = () => {
        switch (status) {
            case TestCaseStatus.PENDING:
                return 'Pending';
            case TestCaseStatus.QUEUED:
                return 'Queued';
            case TestCaseStatus.RUNNING:
                return 'Running';
            case TestCaseStatus.PASSED:
                return 'Passed';
            case TestCaseStatus.FAILED:
                return 'Failed';
            case TestCaseStatus.CANCEL:
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span
                className="text-sm font-medium"
                style={{ color: TEST_STATUS_COLORS[status] }}
            >
                {getStatusText()}
            </span>
            {showExecutionTime && executionTimeMs && (
                <span className="text-xs text-gray-500">
                    ({executionTimeMs}ms)
                </span>
            )}
        </div>
    );
};

export default TestStatusIndicator;
