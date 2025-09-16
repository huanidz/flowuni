import React from 'react';

interface ErrorMessageProps {
    flowError: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ flowError }) => {
    if (!flowError) return null;

    return (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
                Error: {flowError}
            </p>
        </div>
    );
};

export default ErrorMessage;
