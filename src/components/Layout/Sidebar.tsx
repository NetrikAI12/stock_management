// components/Layout/Sidebar.tsx
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Minus, 
  FileText, 
  Users, 
  AlertTriangle, 
  ShoppingCart,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'viewer'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'staff', 'viewer'] },
    { id: 'products', label: 'Products', icon: ShoppingCart, roles: ['admin', 'staff', 'viewer'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'staff', 'viewer'] },
    { id: 'add-stock', label: 'Add Stock', icon: Plus, roles: ['admin', 'staff'] },
    { id: 'distribute-stock', label: 'Distribute Stock', icon: Minus, roles: ['admin', 'staff'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'staff', 'viewer'] },
    { id: 'cylinder-stock-product-wise', label: 'Cylinder Stock Product Wise', icon: Package, roles: ['admin', 'staff'] },
    { id: 'cylinder-stock-customer-wise', label: 'Cylinder Stock Customer Wise', icon: Users, roles: ['admin', 'staff'] },
    { id: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle, roles: ['admin', 'staff', 'viewer'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'staff'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'viewer'));

  return (
    <aside className="bg-white dark:bg-gray-800 w-64 min-h-screen border-r border-gray-200 dark:border-gray-700">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-8">StockFlow Pro</h1>
      <nav className="space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;