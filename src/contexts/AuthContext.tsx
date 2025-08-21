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

// Mock users for demo
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
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call your API
    const foundUser = mockUsers.find(u => u.username === username);
    
    if (foundUser && password === 'password') {
      const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    }
    
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