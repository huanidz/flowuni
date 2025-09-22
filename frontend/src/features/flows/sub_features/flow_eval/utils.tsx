import { TestCaseStatus } from './types';
import { Badge } from '@/components/ui/badge';

const getStatusBadge = (status: TestCaseStatus) => {
    switch (status) {
        case TestCaseStatus.PASSED:
            return (
                <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-700 border-emerald-200"
                >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                    PASSED
                </Badge>
            );
        case TestCaseStatus.FAILED:
            return (
                <Badge
                    variant="outline"
                    className="bg-red-100 text-red-700 border-red-200"
                >
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    FAILED
                </Badge>
            );
        case TestCaseStatus.RUNNING:
            return (
                <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 border-blue-200"
                >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                    RUNNING
                </Badge>
            );
        case TestCaseStatus.PENDING:
        default:
            return (
                <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-700 border-gray-200"
                >
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                    PENDING
                </Badge>
            );
    }
};

export { getStatusBadge };
