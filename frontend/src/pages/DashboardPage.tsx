import React from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useLogout } from '@/features/auth/hooks';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    const logout = useLogout();
    const navigate = useNavigate();

    // Handle logout
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
                <div className="p-4 space-y-2 flex flex-col h-full">
                    <NavLink to="/dashboard/flow" className="block">
                        {({ isActive }) => (
                            <Button
                                className={`w-full transition-all duration-200 ${isActive ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100'}`}
                                variant={isActive ? 'default' : 'ghost'}
                            >
                                Flow
                            </Button>
                        )}
                    </NavLink>
                    <NavLink to="/dashboard/api-keys" className="block">
                        {({ isActive }) => (
                            <Button
                                className={`w-full transition-all duration-200 ${isActive ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100'}`}
                                variant={isActive ? 'default' : 'ghost'}
                            >
                                API Keys
                            </Button>
                        )}
                    </NavLink>
                    <Button
                        className="w-full transition-all duration-200 bg-red-500 text-white shadow-md hover:bg-red-600 mt-auto"
                        variant="default"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </div>
            <div className="flex-1 transition-opacity duration-200 ease-in-out">
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardPage;
