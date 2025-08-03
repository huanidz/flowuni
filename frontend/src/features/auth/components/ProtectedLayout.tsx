// src/features/auth/ProtectedLayout.tsx
import { Outlet } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';

const ProtectedLayout = () => {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
};

export default ProtectedLayout;
