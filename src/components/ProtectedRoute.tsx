import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({ children, requiredRole }) => {
  const { role, hasPermission } = useRole();

  if (!role || !hasPermission('manageSettings')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;