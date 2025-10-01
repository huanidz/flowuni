import React from 'react';
import TabContainer from '../features/templates/components/TabContainer';

const TemplatesPage: React.FC = () => {
    return (
        <div className="flex-1 p-8">
            <div className="flex items-center justify-between p-6 mb-6 bg-gradient-to-r from-[#644CEA] to-[#7B68EE] rounded-lg shadow-sm">
                <div className="text-white">
                    <h1 className="text-2xl font-bold text-white">Templates</h1>
                    <p className="mt-2 text-white/80">
                        Manage your templates here.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <TabContainer />
            </div>
        </div>
    );
};

export default TemplatesPage;
