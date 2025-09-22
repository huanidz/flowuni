import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    TestActionButtons,
    TestCreationButtons,
    TestStatistics,
    TestSuiteGroup,
} from '../../../sub_features/flow_eval/components';
import { TestCaseStatus } from '../../../sub_features/flow_eval/types';
import type { TestStatistics as TestStatisticsType } from '../../../sub_features/flow_eval/types';
import { useTestSuitesWithCases } from '../../../sub_features/flow_eval/hooks';
import useFlowStore from '@/features/flows/stores/flow_stores';


/**
 * Main Flow Evaluation Content Component
 * Displays test suites and test cases with execution controls
 */
const LCEvalContent: React.FC = () => {
    // For now, using a hardcoded flow ID. In a real app, this would come from the context or route params
    const { current_flow } = useFlowStore();
    const flowId = current_flow?.flow_id;

    if (!flowId) {
        return;
    }
    const [expandedSuites, setExpandedSuites] = useState<Set<string>>(
        new Set()
    );
    const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(
        new Set()
    );
    const [isRunning, setIsRunning] = useState(false);

    const [showStatistics, setShowStatistics] = useState(false);

    // Fetch test suites with cases
    const {
        data: testSuites,
        isLoading,
        error,
    } = useTestSuitesWithCases(flowId);

    const statistics = useMemo((): TestStatisticsType => {
        if (!testSuites) {
            return {
                total: 0,
                passed: 0,
                failed: 0,
                pending: 0,
                running: 0,
            };
        }

        const allTestCases = testSuites.flatMap(suite => suite.test_cases);

        return {
            total: allTestCases.length,
            passed: allTestCases.filter(
                tc => tc.status === TestCaseStatus.PASSED
            ).length,
            failed: allTestCases.filter(
                tc => tc.status === TestCaseStatus.FAILED
            ).length,
            pending: allTestCases.filter(
                tc => tc.status === TestCaseStatus.PENDING || !tc.status
            ).length,
            running: allTestCases.filter(
                tc => tc.status === TestCaseStatus.RUNNING
            ).length,
        };
    }, [testSuites]);

    const handleToggleExpand = (suiteId: string) => {
        const newExpanded = new Set(expandedSuites);
        if (newExpanded.has(suiteId)) {
            newExpanded.delete(suiteId);
        } else {
            newExpanded.add(suiteId);
        }
        setExpandedSuites(newExpanded);
    };

    const handleTestCaseSelect = (testCaseId: string) => {
        const newSelected = new Set(selectedTestCases);
        if (newSelected.has(testCaseId)) {
            newSelected.delete(testCaseId);
        } else {
            newSelected.add(testCaseId);
        }
        setSelectedTestCases(newSelected);
    };

    const handleRunAll = () => {
        setIsRunning(true);
        console.log('Running all tests...');
        setTimeout(() => {
            setIsRunning(false);
            console.log('All tests completed');
        }, 3000);
    };

    const handleRunFailed = () => {
        setIsRunning(true);
        console.log('Running failed tests...');
        setTimeout(() => {
            setIsRunning(false);
            console.log('Failed tests completed');
        }, 2000);
    };

    const handleRunSelected = () => {
        setIsRunning(true);
        console.log(
            `Running selected tests: ${Array.from(selectedTestCases).join(', ')}`
        );
        setTimeout(() => {
            setIsRunning(false);
            console.log('Selected tests completed');
        }, 1500);
    };

    React.useEffect(() => {
        if (testSuites) {
            const allSuiteIds = new Set(
                testSuites.map(suite => suite.suite_id)
            );
            setExpandedSuites(allSuiteIds);
        }
    }, [testSuites]);

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-medium">
                            Flow Evaluation
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                            Run and monitor your flow test suites
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatistics(!showStatistics)}
                        className="shrink-0"
                    >
                        {showStatistics ? 'Hide Stats' : 'Show Stats'}
                    </Button>
                </div>
            </div>

            <TestCreationButtons />

            {showStatistics && <TestStatistics statistics={statistics} />}

            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg m-3">
                <div className="p-3 space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                            <h3 className="text-sm font-medium mb-1">
                                Loading Test Suites
                            </h3>
                            <p className="text-xs">
                                Please wait while we fetch your test suites.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-gray-500">
                            <svg
                                className="w-8 h-8 mx-auto mb-3 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h3 className="text-sm font-medium mb-1">
                                Error Loading Test Suites
                            </h3>
                            <p className="text-xs">
                                Failed to load test suites. Please try again.
                            </p>
                        </div>
                    ) : testSuites && testSuites.length > 0 ? (
                        testSuites.map(suite => (
                            <TestSuiteGroup
                                key={suite.suite_id}
                                testSuite={suite}
                                selectedTestCases={selectedTestCases}
                                onTestCaseSelect={handleTestCaseSelect}
                                expandedSuites={expandedSuites}
                                onToggleExpand={handleToggleExpand}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <svg
                                className="w-8 h-8 mx-auto mb-3 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="text-sm font-medium mb-1">
                                No Test Suites
                            </h3>
                            <p className="text-xs">
                                Create test suites to start evaluating your
                                flow.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <TestActionButtons
                statistics={statistics}
                selectedCount={selectedTestCases.size}
                onRunAll={handleRunAll}
                onRunFailed={handleRunFailed}
                onRunSelected={handleRunSelected}
                isRunning={isRunning}
            />
        </div>
    );
};

export default LCEvalContent;
