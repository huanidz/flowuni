import React, { useState } from 'react';
import { Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTestSuiteModal from './CreateTestSuiteModal';
import CreateTestCaseModal from './CreateTestCaseModal';

/**
 * Component with test creation action buttons
 */
const TestCreationButtons: React.FC = () => {
    const [isTestSuiteModalOpen, setIsTestSuiteModalOpen] = useState(false);
    const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

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
        // TODO: Implement API call to create test suite
        console.log('Creating test suite:', { suiteName, suiteDescription });
    };

    const handleCreateTestCase = () => {
        setIsTestCaseModalOpen(true);
    };

    const handleCloseTestCaseModal = () => {
        setIsTestCaseModalOpen(false);
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

                {/* Create Test Case Button */}
                <Button
                    onClick={handleCreateTestCase}
                    variant="secondary"
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Test Case
                </Button>
            </div>

            <CreateTestSuiteModal
                isOpen={isTestSuiteModalOpen}
                onClose={handleCloseTestSuiteModal}
                onSubmit={handleSubmitTestSuite}
            />

            <CreateTestCaseModal
                isOpen={isTestCaseModalOpen}
                onClose={handleCloseTestCaseModal}
            />
        </>
    );
};

export default TestCreationButtons;
