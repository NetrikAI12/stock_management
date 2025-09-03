import React, { useState, useEffect } from 'react';
import { Settings, Lock, Bell, Database, Moon, User, Package, HelpCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useStock } from '../../contexts/StockContext';
<<<<<<< HEAD

// ErrorBoundary component to catch and handle rendering errors
=======
import { useNotifications } from '../../contexts/NotificationContext';

>>>>>>> 6b6b1c6 (More updates after rebase)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-600 dark:text-red-400 text-center">
          <p>Error: {this.state.error}. Please reload the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const { fetchStockData } = useStock();
<<<<<<< HEAD
=======
  const { addNotification } = useNotifications();
>>>>>>> 6b6b1c6 (More updates after rebase)
  const [settings, setSettings] = useState({
    threshold: 10,
    unit: 'units',
    notifications: true,
    discrepancyAlerts: true,
    timeZone: 'Asia/Kolkata',
    darkMode: false,
    sessionTimeout: 15,
    twoFactor: false,
    notificationEmail: '',
    currency: 'INR',
    autoLogout: 30,
    language: 'en',
    backupFrequency: 'weekly',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            await supabase.from('users').insert({ id: user.id, email: user.email, settings: {} });
            return fetchSettings();
          } else {
            throw new Error(`Error fetching settings: ${fetchError.message}`);
          }
        }

        const userSettings = data?.settings || {};
        setSettings({
          threshold: userSettings.threshold || 10,
          unit: userSettings.unit || 'units',
          notifications: userSettings.notifications || true,
          discrepancyAlerts: userSettings.discrepancyAlerts || true,
          timeZone: userSettings.timeZone || 'Asia/Kolkata',
          darkMode: userSettings.darkMode || false,
          sessionTimeout: userSettings.sessionTimeout || 15,
          twoFactor: userSettings.twoFactor || false,
          notificationEmail: userSettings.notificationEmail || '',
          currency: userSettings.currency || 'INR',
          autoLogout: userSettings.autoLogout || 30,
          language: userSettings.language || 'en',
          backupFrequency: userSettings.backupFrequency || 'weekly',
        });
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ settings })
          .eq('id', user.id);

        if (error) throw new Error(`Error saving settings: ${error.message}`);

        setSuccess('Settings saved successfully!');
        document.documentElement.classList.toggle('dark', settings.darkMode);
<<<<<<< HEAD
=======
        addNotification({ type: 'user', message: 'Settings updated successfully' });
>>>>>>> 6b6b1c6 (More updates after rebase)
      }
    } catch (err) {
      console.error('Error in saveSettings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
<<<<<<< HEAD
    const { name, value, type, checked } = e.target;
=======
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
>>>>>>> 6b6b1c6 (More updates after rebase)
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !settings.darkMode;
    setSettings((prev) => ({ ...prev, darkMode: newDarkMode }));
    try {
      if (user) {
        const updatedSettings = { ...settings, darkMode: newDarkMode };
        const { error } = await supabase
          .from('users')
          .update({ settings: updatedSettings })
          .eq('id', user.id);

        if (error) throw new Error(`Error saving dark mode setting: ${error.message}`);

        document.documentElement.classList.toggle('dark', newDarkMode);
        setSuccess('Dark mode updated successfully!');
<<<<<<< HEAD
=======
        addNotification({ type: 'theme', message: `Dark mode ${newDarkMode ? 'enabled' : 'disabled'}` });
>>>>>>> 6b6b1c6 (More updates after rebase)
      }
    } catch (err) {
      console.error('Error in toggleDarkMode:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const syncDataNow = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchStockData();
      setSuccess('Data synced successfully!');
<<<<<<< HEAD
=======
      addNotification({ type: 'stock', message: 'Data synced successfully' });
>>>>>>> 6b6b1c6 (More updates after rebase)
    } catch (err) {
      console.error('Error in syncDataNow:', err);
      setError('Failed to sync data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 dark:text-gray-400">
        <Settings className="h-8 w-8 mx-auto mb-2 animate-spin" />
        <p>Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400">
        <p>{error}. Please try again later.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<<<<<<< HEAD
          {/* User Profile */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
              <User className="h-5 w-5 mr-2" />
              User Profile
            </h3>
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300">
                Email: {user?.email || 'Not logged in'}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Zone</label>
                <select
                  name="timeZone"
                  value={settings.timeZone}
                  onChange={handleChange}
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Email</label>
                <input
                  type="email"
                  name="notificationEmail"
                  value={settings.notificationEmail}
                  onChange={handleChange}
                  placeholder="Enter email for alerts"
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Inventory Configuration */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
              <Package className="h-5 w-5 mr-2" />
              Inventory Configuration
              <HelpCircle className="h-4 w-4 ml-2 text-gray-500 cursor-pointer" title="Set thresholds and units for inventory tracking" />
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Threshold</label>
                <input
                  type="number"
                  name="threshold"
                  value={settings.threshold}
                  onChange={handleChange}
                  min="1"
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Unit</label>
                <select
                  name="unit"
                  value={settings.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="units">Units</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="liters">Liters (L)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Alert Preferences */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
              <Bell className="h-5 w-5 mr-2" />
              Alert Preferences
              <HelpCircle className="h-4 w-4 ml-2 text-gray-500 cursor-pointer" title="Configure notification settings" />
            </h3>
            <div className="space-y-3">
              <label className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={settings.notifications}
                  onChange={handleChange}
                  className="mr-2"
                />
                Enable Low Stock Notifications
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                <input
                  type="checkbox"
                  name="discrepancyAlerts"
                  checked={settings.discrepancyAlerts}
                  onChange={handleChange}
                  className="mr-2"
                />
                Enable Discrepancy Alerts
              </label>
            </div>
          </div>

<<<<<<< HEAD
          {/* Security Settings */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
              <Lock className="h-5 w-5 mr-2" />
              Security Settings
              <HelpCircle className="h-4 w-4 ml-2 text-gray-500 cursor-pointer" title="Manage session and authentication settings" />
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Timeout (minutes)</label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={settings.sessionTimeout}
                  onChange={handleChange}
                  min="5"
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Logout After (minutes)</label>
                <input
                  type="number"
                  name="autoLogout"
                  value={settings.autoLogout}
                  onChange={handleChange}
                  min="10"
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <label className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                <input
                  type="checkbox"
                  name="twoFactor"
                  checked={settings.twoFactor}
                  onChange={handleChange}
                  className="mr-2"
                />
                Enable Two-Factor Authentication
              </label>
            </div>
          </div>

<<<<<<< HEAD
          {/* Theme and UI */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
              <Moon className="h-5 w-5 mr-2" />
              Theme & UI
              <HelpCircle className="h-4 w-4 ml-2 text-gray-500 cursor-pointer" title="Customize the app's appearance" />
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dark Mode</label>
                <button
                  onClick={toggleDarkMode}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    settings.darkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {settings.darkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                <select
                  name="language"
                  value={settings.language}
                  onChange={handleChange}
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Data Management */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-3">
              <Database className="h-5 w-5 mr-2" />
              Data Management
              <HelpCircle className="h-4 w-4 ml-2 text-gray-500 cursor-pointer" title="Sync or backup your data" />
            </h3>
            <div className="space-y-3">
              <button
                onClick={syncDataNow}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 mr-2 text-sm"
              >
                {loading ? 'Syncing...' : 'Sync Data Now'}
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Backup Frequency</label>
                <select
                  name="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={handleChange}
                  className="mt-1 block w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Save and Logout */}
=======
>>>>>>> 6b6b1c6 (More updates after rebase)
        <div className="flex justify-between mt-4">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
<<<<<<< HEAD
            onClick={logout}
=======
            onClick={() => {
              logout();
              addNotification({ type: 'user', message: 'User logged out' });
            }}
>>>>>>> 6b6b1c6 (More updates after rebase)
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>

        {success && <p className="mt-4 text-green-600 dark:text-green-400 text-sm">{success}</p>}
        {error && <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>}
      </div>
    </ErrorBoundary>
  );
};

export default SettingsView;