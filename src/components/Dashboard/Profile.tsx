// src/components/Profile/Profile.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';
import Header from '../Layout/Header';

interface ProfileProps {
  setActiveTab: (tab: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ setActiveTab }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header setActiveTab={setActiveTab} />
        <div className="text-center p-4 text-red-600 dark:text-red-400">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header setActiveTab={setActiveTab} />
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            aria-label="Close profile"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={user.photo || 'https://via.placeholder.com/64'}
                alt="User avatar"
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User ID</label>
              <p className="text-sm text-gray-900 dark:text-white">{user.id}</p>
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;