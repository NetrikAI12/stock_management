import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface RoleContextType {
  role: string | null;
  hasPermission: (permission: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(user?.role || null);
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    if (!role) return false;
    const permissions = {
      admin: ['view', 'add', 'edit', 'delete', 'manageSettings'],
      staff: ['view', 'add', 'edit'],
      viewer: ['view'],
    };
    const allowed = permissions[role as keyof typeof permissions] || [];
    const hasAccess = allowed.includes(permission);
    if (!hasAccess) {
      addNotification({
        type: 'user',
        message: "You don’t have permission to perform this action.",
      });
    }
    return hasAccess;
  };

  return (
    <RoleContext.Provider value={{ role, hasPermission }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
};