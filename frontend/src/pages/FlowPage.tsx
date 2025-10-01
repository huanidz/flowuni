import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
            <div className="flex-1 p-8">
                <div className="flex items-center justify-between p-6 mb-6 bg-gradient-to-r from-[#644CEA] to-[#7B68EE] rounded-lg shadow-sm">
                    <div className="text-white">
                        <h1 className="text-2xl font-bold text-white">
                            Flow Dashboard
                        </h1>
                        <p className="mt-2 text-white/80">
                            Manage your flows here.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-white text-[#644CEA] hover:bg-gray-50 border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Flow
                    </Button>
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
