// src/components/AuthGuard.tsx
import { useEffect } from 'react';
import useAuthStore from './store';
import { useNavigate } from 'react-router-dom';
import { type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactElement;
}


const Spinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
  </div>
);

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isValidating, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        navigate('/auth');
      }
    });
  }, [navigate, checkAuth]);

  // Show nothing while validating to prevent flash
  if (isValidating || !isAuthenticated) {
    return <Spinner/>; // or a subtle loading spinner
  }

  return children;
};