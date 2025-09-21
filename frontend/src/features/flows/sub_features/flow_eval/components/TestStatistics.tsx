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
    return (
        <div className="flex items-center justify-end p-4 bg-gray-50 border-b text-sm text-gray-600">
            <div className="flex items-center gap-4">
                <span>
                    Total: <strong>{statistics.total}</strong>
                </span>
                <span className="text-emerald-600">
                    Passed: <strong>{statistics.passed}</strong>
                </span>
                <span className="text-red-600">
                    Failed: <strong>{statistics.failed}</strong>
                </span>
                <span className="text-blue-600">
                    Running: <strong>{statistics.running}</strong>
                </span>
                <span className="text-gray-600">
                    Pending: <strong>{statistics.pending}</strong>
                </span>
            </div>
        </div>
    );
};

export default TestStatisticsDisplay;
