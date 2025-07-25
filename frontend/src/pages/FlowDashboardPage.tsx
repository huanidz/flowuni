import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import FlowList from '@/components/FlowList/FlowList';

import { useLogout } from '@/features/auth/hooks';
import { useNavigate } from 'react-router-dom';

const FlowDashboardPage: React.FC = () => {

  const logout = useLogout();
  const navigate = useNavigate();

  const dummyFlows = [
    {
      id: '1',
      name: 'Quy trình đăng ký khách hàng',
      description: 'Tự động hóa quy trình đăng ký và xác thực khách hàng mới',
      status: 'active' as 'active',
      lastRun: '2024-07-20 14:30',
      runCount: 1250,
      successRate: 98.5,
    },
    {
      id: '2',
      name: 'Xử lý đơn hàng',
      description: 'Workflow xử lý đơn hàng từ nhận order đến giao hàng',
      status: 'paused' as 'paused',
      lastRun: '2024-07-19 09:15',
      runCount: 856,
      successRate: 97.2,
    },
  ];

  const handleLogout = async () => {
    
    try {
      await logout.mutateAsync();

      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
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
          <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            + Tạo Flow mới
          </Button>
        </div>
        <FlowList flows={dummyFlows} />
      </div>
    </div>
  );
};

export default FlowDashboardPage;
