import React from 'react';
import type { TestStatistics } from '../types';

interface TestStatisticsDisplayProps {
    statistics: TestStatistics;
}

/**
 * Component to display test statistics
 */
const TestStatisticsDisplay: React.FC<TestStatisticsDisplayProps> = ({
    statistics,
}) => {
    const getProgressPercentage = (value: number) => {
        if (statistics.total === 0) return 0;
        return Math.round((value / statistics.total) * 100);
    };

    return (
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
                {/* Left side - Title */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-200 px-2 py-1 rounded">
                        STATISTICS
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                        Test Execution Overview
                    </span>
                </div>

                {/* Right side - Statistics */}
                <div className="flex items-center gap-3">
                    {/* Total Badge */}
                    <div
                        className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 cursor-help"
                        title="Total Test Cases - All test cases in the current selection"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <span className="text-xs text-slate-500">TOTAL</span>
                        <span className="font-bold">{statistics.total}</span>
                    </div>

                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Status Badges */}
                    {statistics.passed > 0 && (
                        <div
                            className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-200 cursor-help"
                            title="Passed Tests - Tests that completed successfully"
                        >
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                            <span className="font-bold">
                                {statistics.passed}
                            </span>
                            <span className="text-xs opacity-75">
                                ({getProgressPercentage(statistics.passed)}%)
                            </span>
                        </div>
                    )}

                    {statistics.failed > 0 && (
                        <div
                            className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 cursor-help"
                            title="Failed Tests - Tests that encountered errors or didn't meet expectations"
                        >
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                            <span className="font-bold">
                                {statistics.failed}
                            </span>
                            <span className="text-xs opacity-75">
                                ({getProgressPercentage(statistics.failed)}%)
                            </span>
                        </div>
                    )}

                    {statistics.running > 0 && (
                        <div
                            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200 cursor-help"
                            title="Running Tests - Tests currently being executed"
                        >
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="font-bold">
                                {statistics.running}
                            </span>
                            <span className="text-xs opacity-75">
                                ({getProgressPercentage(statistics.running)}%)
                            </span>
                        </div>
                    )}

                    {statistics.pending > 0 && (
                        <div
                            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 cursor-help"
                            title="Pending Tests - Tests waiting to be executed"
                        >
                            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                            <span className="font-bold">
                                {statistics.pending}
                            </span>
                            <span className="text-xs opacity-75">
                                ({getProgressPercentage(statistics.pending)}%)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {statistics.total > 0 && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>
                            {getProgressPercentage(
                                statistics.passed + statistics.failed
                            )}{' '}
                            / 100% complete
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full flex">
                            {statistics.passed > 0 && (
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{
                                        width: `${getProgressPercentage(statistics.passed)}%`,
                                    }}
                                ></div>
                            )}
                            {statistics.failed > 0 && (
                                <div
                                    className="bg-red-500 h-full transition-all duration-500"
                                    style={{
                                        width: `${getProgressPercentage(statistics.failed)}%`,
                                    }}
                                ></div>
                            )}
                            {statistics.running > 0 && (
                                <div
                                    className="bg-blue-500 h-full transition-all duration-500 animate-pulse"
                                    style={{
                                        width: `${getProgressPercentage(statistics.running)}%`,
                                    }}
                                ></div>
                            )}
                            {statistics.pending > 0 && (
                                <div
                                    className="bg-gray-400 h-full transition-all duration-500"
                                    style={{
                                        width: `${getProgressPercentage(statistics.pending)}%`,
                                    }}
                                ></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestStatisticsDisplay;
