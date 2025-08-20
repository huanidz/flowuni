import React from 'react';

const ApiKeyPage: React.FC = () => {
    return (
        <div className="flex-1 p-8">
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="mt-2">Manage your API keys here.</p>
            <div className="mt-6">
                <p className="text-gray-600">
                    API Key management functionality will be implemented here.
                </p>
                {/* TODO: Add API key listing, creation, deletion functionality */}
            </div>
        </div>
    );
};

export default ApiKeyPage;
