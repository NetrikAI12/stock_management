// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@company.com',
    role: 'admin',
    firstName: 'John',
    lastName: 'Admin',
    createdAt: '2024-01-01',
    mfaEnabled: true,
    photo: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    username: 'staff',
    email: 'staff@company.com',
    role: 'staff',
    firstName: 'Jane',
    lastName: 'Staff',
    createdAt: '2024-01-01',
    mfaEnabled: false,
    photo: 'https://via.placeholder.com/150',
  },
  {
    id: '3',
    username: 'viewer',
    email: 'viewer@company.com',
    role: 'viewer',
    firstName: 'Bob',
    lastName: 'Viewer',
    createdAt: '2024-01-01',
    mfaEnabled: false,
    photo: 'https://via.placeholder.com/150',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const foundUser = mockUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (foundUser && password === 'password') {
      const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};