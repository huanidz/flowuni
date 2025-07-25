import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import FlowList from '@/components/FlowList/FlowList';

import { useLogout } from '@/features/auth/hooks';
import { useNavigate } from 'react-router-dom';
import { useFlows } from '@/features/flows/hooks';
import useAuthStore from '@/features/auth/store';
import { useCreateEmptyFlow } from '@/features/flows/hooks';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const FlowDashboardPage: React.FC = () => {
  const logout = useLogout();
  const navigate = useNavigate();
  const { user_id } = useAuthStore();
  const { data: flows, isLoading, isError } = useFlows({ userId: user_id as number });

  const createFlowMutation = useCreateEmptyFlow();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateFlow = async () => {
    try {
      console.log('Create flow');
      const { flow_id } = await createFlowMutation.mutateAsync();
      toast('Flow Created', {
        description: `Flow flow_id:${flow_id} created successfully.`,
      });
    } catch (error) {
      console.error('Create flow failed:', error);
      toast('Error', {
        description: 'An error occurred while creating flow.',
      });
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r bg-gray-50 flex flex-col h-full">
        <Logo />
        <div className="p-4">
          <Button className="w-full">Flow</Button>
        </div>
        <Button className="w-full mt-auto" onClick={handleLogout}>Logout</Button>
      </div>
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
          <Button onClick={handleCreateFlow} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            + Tạo Flow mới
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
      <Toaster />
    </div>
  );
};

export default FlowDashboardPage;
