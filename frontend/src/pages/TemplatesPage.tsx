import React from 'react';

const TemplatesPage: React.FC = () => {
    return (
        <div className="flex-1 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Templates</h1>
                    <p className="mt-2 text-gray-600">
                        Manage your templates here.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <div className="text-center py-8">
                    <p className="text-gray-600">
                        Templates content will be added here.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TemplatesPage;
