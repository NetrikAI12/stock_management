import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: () => void;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seen, setSeen] = useState<number[]>([]);

  useEffect(() => {
    const storedSeen = JSON.parse(localStorage.getItem('seenNotifs') || '[]');
    setSeen(storedSeen);
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    const { data: customers } = await supabase.from('customers').select('*').order('createdat', { ascending: false }).limit(3);
    const customerNotifs = customers?.map(c => ({
      id: c.customerid,
      message: `New customer added: ${c.customername}`,
      type: 'success',
      time: new Date(c.createdat).toLocaleString(),
    })) || [];

    const { data: products } = await supabase.from('products').select('*').order('createdat', { ascending: false }).limit(3);
    const productNotifs = products?.map(p => ({
      id: p.productid,
      message: `New product added: ${p.productname}`,
      type: 'success',
      time: new Date(p.createdat).toLocaleString(),
    })) || [];

    const { data: distribs } = await supabase.from('transactions').select('*').eq('type', 'out').order('timestamp', { ascending: false }).limit(3);
    const distribNotifs = distribs?.map(d => ({
      id: d.id,
      message: `Stock distributed: ${Math.abs(d.quantity)} of ${d.itemName}`,
      type: 'info',
      time: new Date(d.timestamp).toLocaleString(),
    })) || [];

    const allNotifs = [...customerNotifs, ...productNotifs, ...distribNotifs]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    setNotifications(allNotifs);
  };

  const filteredNotifications = notifications.filter(n => !seen.includes(n.id));

  const handleCloseNotifications = () => {
    const newSeen = [...seen, ...filteredNotifications.map(n => n.id)];
    setSeen(newSeen);
    localStorage.setItem('seenNotifs', JSON.stringify(newSeen));
    setShowNotifications(false);
  };

  const handleToggleDarkMode = () => {
    setDarkMode();
  };

  const handleOpenProfile = () => {
    setShowUserMenu(false);
    setActiveTab('profile');
  };

  const handleOpenSettings = () => {
    setShowUserMenu(false);
    setActiveTab('settings');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.role === 'admin' ? 'System Administrator' :
             user?.role === 'staff' ? 'Staff Member' : 'Viewer'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {filteredNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {filteredNotifications.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  <button onClick={handleCloseNotifications} className="text-sm text-blue-600">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                        <p className="text-sm text-gray-800 dark:text-white">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      No notifications available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="User Menu"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                <div className="p-2">
                  <button onClick={handleOpenProfile} className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </button>
                  <button onClick={handleOpenSettings} className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-600" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;