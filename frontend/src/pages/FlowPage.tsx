import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FlowList from '@/features/flows/components/FlowList/FlowList';
import { useFlows } from '@/features/flows/hooks';
import useAuthStore from '@/features/auth/store';
import { useQueryClient } from '@tanstack/react-query';
import CreateFlowModal from '@/features/flows/components/FlowList/CreateFlowModal';

const FlowPage: React.FC = () => {
    const { user_id } = useAuthStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const {
        data: flowsData,
        isLoading,
        error,
    } = useFlows({ userId: user_id as number, page: currentPage, pageSize });
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateFlowSuccess = () => {
        // Invalidate flows query to get fresh data
        queryClient.invalidateQueries({ queryKey: ['flows', user_id] });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="flex-1 p-4 h-screen flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h1 className="text-xl font-bold">Flow Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your flows
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white active:scale-95 transform transition-transform duration-150 h-9 px-4 text-sm"
                    >
                        + Create
                    </Button>
                </div>
                <div className="mb-4">
                    <div className="flex items-center border rounded-md px-3 py-1.5 w-64">
                        <span className="text-gray-500 mr-2 text-sm">🔍</span>
                        <input
                            type="text"
                            placeholder="Search flows..."
                            className="focus:outline-none bg-transparent text-sm w-full"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <FlowList
                        flows={flowsData?.data || []}
                        pagination={flowsData?.pagination}
                        onPageChange={handlePageChange}
                        currentPage={currentPage}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
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
