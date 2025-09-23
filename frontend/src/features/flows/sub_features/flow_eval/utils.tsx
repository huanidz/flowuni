import { TestCaseRunStatus } from './types';
import { Badge } from '@/components/ui/badge';

const getStatusBadge = (status: TestCaseRunStatus) => {
    switch (status) {
        case TestCaseRunStatus.PASSED:
            return (
                <Badge
                    variant="outline"
                    className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                    PASSED
                </Badge>
            );
        case TestCaseRunStatus.FAILED:
            return (
                <Badge
                    variant="outline"
                    className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                >
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    FAILED
                </Badge>
            );
        case TestCaseRunStatus.RUNNING:
            return (
                <Badge
                    variant="outline"
                    className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                    RUNNING
                </Badge>
            );
        case TestCaseRunStatus.PENDING:
        default:
            return (
                <Badge
                    variant="outline"
                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                >
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-1"></div>
                    PENDING
                </Badge>
            );
    }
};

export default getStatusBadge;
