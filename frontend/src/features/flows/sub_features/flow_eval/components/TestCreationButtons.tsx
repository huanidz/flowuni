import React from 'react';
import { Folder, Plus } from 'lucide-react';

/**
 * Component with test creation action buttons
 */
const TestCreationButtons: React.FC = () => {
    const handleCreateTestSuite = () => {
        // For now, do nothing as requested
        console.log('Create Test Suite clicked');
    };

    const handleCreateTestCase = () => {
        // For now, do nothing as requested
        console.log('Create Test Case clicked');
    };

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-b">
            {/* Create Test Suite Button */}
            <button
                onClick={handleCreateTestSuite}
                className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800
        `}
            >
                <Folder className="w-3.5 h-3.5" />
                Create Test Suite
            </button>

            {/* Create Test Case Button */}
            <button
                onClick={handleCreateTestCase}
                className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800
        `}
            >
                <Plus className="w-3.5 h-3.5" />
                Create Test Case
            </button>
        </div>
    );
};

export default TestCreationButtons;
