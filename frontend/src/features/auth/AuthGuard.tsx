// src/components/AuthGuard.tsx
import { useEffect } from 'react';
import useAuthStore from './store';
import { useNavigate } from 'react-router-dom';
import { type ReactElement } from 'react';

interface AuthGuardProps {
  children: ReactElement;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        navigate('/auth');
      }
    });
  }, [navigate, checkAuth]);

  if (!isAuthenticated) return null; // or a loading spinner

  return children;
};