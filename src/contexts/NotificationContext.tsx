// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  markAsViewed: (id: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'viewed'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'stock',
      message: 'Low stock alert: Product XYZ is below threshold',
      timestamp: new Date().toISOString(),
      viewed: false,
    },
    {
      id: 2,
      type: 'transaction',
      message: 'New transaction recorded',
      timestamp: new Date().toISOString(),
      viewed: false,
    },
  ]);

  const markAsViewed = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, viewed: true } : n))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'viewed'>) => {
    const newNotification: Notification = {
      id: notifications.length + 1,
      ...notification,
      timestamp: new Date().toISOString(),
      viewed: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsViewed, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};