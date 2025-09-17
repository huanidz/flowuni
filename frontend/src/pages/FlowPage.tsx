import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FlowList from '@/features/flows/components/FlowList/FlowList';
import { useFlows } from '@/features/flows/hooks';
import useAuthStore from '@/features/auth/store';
import { useQueryClient } from '@tanstack/react-query';
import CreateFlowModal from '@/features/flows/components/FlowList/CreateFlowModal';

const FlowPage: React.FC = () => {
    const { user_id } = useAuthStore();
    const {
        data: flows,
        isLoading,
        isError,
    } = useFlows({ userId: user_id as number });
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateFlowSuccess = () => {
        // Invalidate flows query to get fresh data
        queryClient.invalidateQueries({ queryKey: ['flows', user_id] });
    };

    return (
        <>
            <div className="flex-1 p-8">
                <h1 className="text-2xl font-bold">Flow Dashboard Page</h1>
                <p className="mt-2">Welcome to the Flow Dashboard!</p>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center border rounded-md px-3 py-2">
                            <span className="text-gray-500 mr-2">🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm flows."
                                className="focus:outline-none bg-transparent"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white active:scale-95 transform transition-transform duration-150"
                    >
                        + Create
                    </Button>
                </div>

                {/* Display loading, error, or the flow list */}
                {isLoading ? (
                    <p>Loading flows...</p>
                ) : isError ? (
                    <p>Error loading flows. Please try again.</p>
                ) : (
                    <FlowList flows={flows?.data || []} />
                )}
            </div>

            <CreateFlowModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateFlowSuccess}
            />
        </>
    );
};

export default FlowPage;
