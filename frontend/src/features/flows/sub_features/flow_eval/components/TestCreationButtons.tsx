import React from 'react';

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
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                </svg>
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
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                </svg>
                Create Test Case
            </button>
        </div>
    );
};

export default TestCreationButtons;
