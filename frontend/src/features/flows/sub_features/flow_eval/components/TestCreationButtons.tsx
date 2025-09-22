import React, { useState } from 'react';

import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTestSuiteModal from './CreateTestSuiteModal';
import { useCreateTestSuite } from '../hooks';
import useFlowStore from '@/features/flows/stores/flow_stores';


/**
 * Component with test creation action buttons
 */
const TestCreationButtons: React.FC = () => {
    const [isTestSuiteModalOpen, setIsTestSuiteModalOpen] = useState(false);

    const { current_flow } = useFlowStore();
    const flowId = current_flow?.flow_id;

    if (!flowId) {
        return;
    }

    const createTestSuiteMutation = useCreateTestSuite();

    const handleCreateTestSuite = () => {
        setIsTestSuiteModalOpen(true);
    };

    const handleCloseTestSuiteModal = () => {
        setIsTestSuiteModalOpen(false);
    };

    const handleSubmitTestSuite = (
        suiteName: string,
        suiteDescription: string
    ) => {
        createTestSuiteMutation.mutate({
            flow_id: flowId,
            name: suiteName,
            description: suiteDescription,
        });
        setIsTestSuiteModalOpen(false);
    };

    return (
        <>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-b">
                {/* Create Test Suite Button */}
                <Button
                    onClick={handleCreateTestSuite}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Folder className="w-3.5 h-3.5 mr-1" />
                    Create Test Suite
                </Button>
            </div>

            <CreateTestSuiteModal
                isOpen={isTestSuiteModalOpen}
                onClose={handleCloseTestSuiteModal}
                onSubmit={handleSubmitTestSuite}
            />
        </>
    );
};

export default TestCreationButtons;
