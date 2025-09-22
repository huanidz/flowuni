import { TestCaseStatus } from './types';

const getStatusBadge = (status: TestCaseStatus) => {
    switch (status) {
        case TestCaseStatus.PASSED:
            return (
                <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    PASSED
                </div>
            );
        case TestCaseStatus.FAILED:
            return (
                <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    FAILED
                </div>
            );
        case TestCaseStatus.RUNNING:
            return (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    RUNNING
                </div>
            );
        case TestCaseStatus.PENDING:
        default:
            return (
                <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    PENDING
                </div>
            );
    }
};

export { getStatusBadge };
