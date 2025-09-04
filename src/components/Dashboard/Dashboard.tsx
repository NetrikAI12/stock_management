import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Define interfaces for props and data
interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
}

interface Transaction {
  timestamp: string;
  message: string;
  user: string;
}

interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
  threshold: number;
  units: string;
}

interface HoverCardProps {
  children: React.ReactNode;
  popupContent: React.ReactNode;
  color?: string;
}

interface ChartWidgetProps {
  type: 'bar' | 'line';
  title: string;
  data: any;
  options: any;
}

interface Summary {
  totalCylinders: number;
  totalValue: number;
  lowStockItems: number;
  productSummary: { name: string; quantity: number }[];
}

// StatsCard Component
const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, changeType, icon: Icon, color }) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-300">{title}</h4>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className={`text-sm ${changeType === 'positive' ? 'text-green-500' : changeType === 'negative' ? 'text-red-500' : 'text-gray-400'}`}>
          {change}
        </p>
      </div>
      <div className={`p-2 rounded-full bg-${color}-100 dark:bg-${color}-900/50`}>
        <Icon className={`h-5 w-5 text-${color}-500 dark:text-${color}-400`} />
      </div>
    </div>
  </div>
);

// ProgressBar Component
const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color }) => (
  <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
    <div className={`bg-${color}-500 h-full`} style={{ width: `${(value / max) * 100}%` }} />
  </div>
);

// RecentTransactions Component
const RecentTransactions: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => (
  <div className="space-y-2">
    {transactions.map((tx, index) => (
      <div key={index} className="flex items-start space-x-3 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg">
        <div className="mt-1 w-2 h-2 bg-red-500 rounded-full" />
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{tx.message}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(tx.timestamp).toLocaleDateString('en-IN')} by {tx.user}</p>
        </div>
      </div>
    ))}
  </div>
);

// ErrorBoundary Component
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
        <div className="text-center py-10 text-red-600 dark:text-red-400">
          Error: {this.state.error}. Please reload the page or contact support.
        </div>
      );
    }
    return this.props.children;
  }
}

// LowStockAlerts Component
const LowStockAlerts: React.FC<{ items: LowStockItem[] }> = ({ items }) => (
  <div className="space-y-4">
    {items.map((item) => (
      <div key={item.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
        <p className="font-medium text-red-900 dark:text-red-100">{item.name}</p>
        <div className="mt-1 p-2 bg-red-100 dark:bg-red-700/50 rounded">
          <p className="text-sm text-red-700 dark:text-red-100">
            Quantity: {item.quantity} {item.units} (Threshold: {item.threshold})
          </p>
        </div>
      </div>
    ))}
  </div>
);

// HoverCard Component
const HoverCard: React.FC<HoverCardProps> = ({ children, popupContent, color = 'gray' }) => {
  const [showPopup, setShowPopup] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setShowPopup(true), 1000);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowPopup(false);
  };

  const calculatePosition = () => {
    if (!cardRef.current || !popupRef.current) return { top: 0, left: 0 };
    const cardRect = cardRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = cardRect.top - popupRect.height - 10;
    let left = cardRect.left + cardRect.width + 10;

    if (top < 0) top = cardRect.bottom + 10;
    if (left + popupRect.width > windowWidth) left = cardRect.left - popupRect.width - 10;
    if (left < 0) left = cardRect.left + cardRect.width + 10;
    if (top + popupRect.height > windowHeight) top = cardRect.top - popupRect.height - 10;

    return { top, left };
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={cardRef}>
      {children}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className={`absolute z-10 bg-gradient-to-br from-${color}-100 to-${color}-200 dark:from-${color}-900/70 dark:to-${color}-800/70 p-4 rounded-lg shadow-lg min-w-[300px] max-h-[300px] overflow-y-auto border border-${color}-300 dark:border-${color}-500 backdrop-blur-sm text-gray-900 dark:text-gray-100`}
            style={calculatePosition()}
          >
            {popupContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ChartWidget Component with fixed height
const ChartWidget: React.FC<ChartWidgetProps> = ({ type, title, data, options }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="h-[200px]">
      {type === 'bar' ? <Bar data={data} options={options} /> : <Line data={data} options={options} />}
    </div>
  </div>
);

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalCylinders: 0,
    totalValue: 0,
    lowStockItems: 0,
    productSummary: [],
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'total-cylinders', x: 0, y: 0, w: 2, h: 2 },
      { i: 'total-sales', x: 2, y: 0, w: 2, h: 2 },
      { i: 'low-stock', x: 4, y: 0, w: 2, h: 2 },
      { i: 'recent-sales', x: 6, y: 0, w: 2, h: 2 },
      { i: 'stock-levels', x: 0, y: 2, w: 4, h: 4 },
      { i: 'low-stock-alerts', x: 4, y: 2, w: 4, h: 4 },
      { i: 'transactions', x: 0, y: 6, w: 8, h: 4 },
      { i: 'sales-trend', x: 0, y: 10, w: 4, h: 4 },
      { i: 'stock-distribution', x: 4, y: 10, w: 4, h: 4 },
    ],
  });

  // Chart data
  const salesTrendData = {
    labels: summary.productSummary.map((item) => item.name),
    datasets: [
      {
        label: 'Sales by Product',
        data: summary.productSummary.map((item) => item.quantity),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const stockDistributionData = {
    labels: summary.productSummary.map((item) => item.name),
    datasets: [
      {
        label: 'Stock Distribution',
        data: summary.productSummary.map((item) => item.quantity),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
  };

  useEffect(() => {
    const fetchDashboardData = () => {
      try {
        // Mock data
        const mockData = {
          cylinderstockproductwise: [
            { cylinderstockid: 1, productid: 1, physicalstock: 3, transactiondate: '2025-09-01' },
            { cylinderstockid: 2, productid: 2, physicalstock: 4, transactiondate: '2025-09-01' },
            { cylinderstockid: 3, productid: 3, physicalstock: 40, transactiondate: '2025-09-01' },
            { cylinderstockid: 4, productid: 4, physicalstock: 26, transactiondate: '2025-09-01' },
            { cylinderstockid: 5, productid: 5, physicalstock: 37, transactiondate: '2025-09-01' },
          ],
          products: [
            { productid: 1, productname: 'Oxygen Cylinder' },
            { productid: 2, productname: 'Nitrous Oxide Cylinder' },
            { productid: 3, productname: 'Medical Air Cylinder' },
            { productid: 4, productname: 'Carbon Dioxide Cylinder' },
            { productid: 5, productname: 'Helium-Oxygen Mixture Cylinder' },
          ],
          stocktransactions: [
            { id: 1, productid: 1, createdat: '2025-09-01T09:00:00Z', sales: 60 },
            { id: 2, productid: 2, createdat: '2025-09-01T09:00:00Z', sales: 38 },
            { id: 3, productid: 3, createdat: '2025-09-01T09:00:00Z', sales: 8 },
            { id: 4, productid: 4, createdat: '2025-09-01T09:00:00Z', sales: 3 },
            { id: 5, productid: 5, createdat: '2025-09-01T09:00:00Z', sales: 4 },
          ],
        };

        const productData = mockData.cylinderstockproductwise;
        const totalCylinders = productData.reduce((sum, item) => sum + item.physicalstock, 0);
        const productSummary = productData.map((item) => {
          const product = mockData.products.find((p) => p.productid === item.productid);
          return { name: product!.productname, quantity: item.physicalstock };
        });
        const totalValue = totalCylinders * 10;
        const lowStock = productData
          .filter((item) => item.physicalstock <= 5)
          .map((item) => {
            const product = mockData.products.find((p) => p.productid === item.productid);
            return {
              id: item.cylinderstockid,
              name: product!.productname,
              quantity: item.physicalstock,
              threshold: 5,
              units: 'Cylinders',
            };
          });
        const transactions = mockData.stocktransactions.map((tx) => ({
          timestamp: tx.createdat,
          message: `Distributed ${tx.sales} units to Customer`,
          user: 'System User',
        }));

        setSummary({ totalCylinders, totalValue, lowStockItems: lowStock.length, productSummary });
        setLowStockItems(lowStock);
        setRecentTransactions(transactions.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const onLayoutChange = (newLayout: any) => {
    setLayouts({ lg: newLayout });
    localStorage.setItem('dashboardLayout', JSON.stringify({ lg: newLayout }));
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading dashboard data...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600 dark:text-red-400">Error: {error}. Please try again later or check your connection.</div>;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Inventory Dashboard</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        </div>

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={100}
          margin={[16, 16]} // Add spacing between widgets
          containerPadding={[16, 16]} // Add padding around the grid
          onLayoutChange={onLayoutChange}
          isDraggable
          isResizable
        >
          <div key="total-cylinders" className="p-2">
            <HoverCard
              color="blue"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-200">Cylinder Counts and Types</h4>
                  <ul className="space-y-1 text-sm">
                    {summary.productSummary.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.quantity} items</span>
                      </li>
                    ))}
                  </ul>
                </>
              }
            >
              <StatsCard
                title="Total Cylinders"
                value={summary.totalCylinders.toLocaleString()}
                change="+5% from last month"
                changeType="positive"
                icon={Package}
                color="blue"
              />
            </HoverCard>
          </div>
          <div key="total-sales" className="p-2">
            <HoverCard
              color="green"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-green-800 dark:text-green-200">Sales Breakdown by Date/Product</h4>
                  <p className="text-sm">No sales data available.</p>
                </>
              }
            >
              <StatsCard
                title="Total Sales Value"
                value={`$${summary.totalValue.toLocaleString()}`}
                change="+3.8% from last month"
                changeType="positive"
                icon={TrendingUp}
                color="green"
              />
            </HoverCard>
          </div>
          <div key="low-stock" className="p-2">
            <HoverCard
              color="red"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-red-800 dark:text-red-200">List of Low Stock Cylinders</h4>
                  <ul className="space-y-1 text-sm">
                    {lowStockItems.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.quantity} (threshold: {item.threshold})</span>
                      </li>
                    ))}
                  </ul>
                </>
              }
            >
              <StatsCard
                title="Low Stock Cylinders"
                value={summary.lowStockItems.toLocaleString()}
                change={summary.lowStockItems > 0 ? 'Requires attention' : 'All good'}
                changeType={summary.lowStockItems > 0 ? 'negative' : 'positive'}
                icon={AlertTriangle}
                color="red"
              />
            </HoverCard>
          </div>
          <div key="recent-sales" className="p-2">
            <HoverCard
              color="purple"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-purple-800 dark:text-purple-200">Last 5 Sales Transactions</h4>
                  <ul className="space-y-1 text-sm">
                    {recentTransactions.map((tx, index) => (
                      <li key={index}>
                        {new Date(tx.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} - {tx.message}
                      </li>
                    ))}
                  </ul>
                </>
              }
            >
              <StatsCard
                title="Recent Sales"
                value={`$${summary.totalValue.toLocaleString()}`}
                change="Last 7 days"
                changeType="neutral"
                icon={Activity}
                color="purple"
              />
            </HoverCard>
          </div>
          <div key="stock-levels" className="p-2">
            <HoverCard
              color="blue"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-200">Per-Cylinder Details</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left p-2">Product</th>
                        <th className="text-right p-2">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.productSummary.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300 dark:border-gray-600">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2 text-right">{item.quantity} items</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              }
            >
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cylinder Stock Levels</h3>
                {summary.productSummary.map((item, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                      <span>{item.name}</span>
                      <span>{item.quantity} items</span>
                    </div>
                    <ProgressBar value={item.quantity} max={50} color={index === 0 ? 'blue' : 'green'} />
                  </div>
                ))}
              </div>
            </HoverCard>
          </div>
          <div key="low-stock-alerts" className="p-2">
            <HoverCard
              color="red"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-red-800 dark:text-red-200">Detailed Product Alerts</h4>
                  <ul className="space-y-1 text-sm">
                    {lowStockItems.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.quantity} (threshold: {item.threshold})</span>
                      </li>
                    ))}
                  </ul>
                </>
              }
            >
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Low Stock Alerts</h3>
                {lowStockItems.length > 0 ? (
                  <LowStockAlerts items={lowStockItems} />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">All stock levels are healthy!</div>
                )}
              </div>
            </HoverCard>
          </div>
          <div key="transactions" className="p-2">
            <HoverCard
              color="purple"
              popupContent={
                <>
                  <h4 className="font-bold mb-2 text-purple-800 dark:text-purple-200">More Recent Transactions</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx, index) => (
                        <tr key={index} className="border-b border-gray-300 dark:border-gray-600">
                          <td className="p-2">{new Date(tx.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                          <td className="p-2">{tx.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              }
            >
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sales Transactions</h3>
                {recentTransactions.length > 0 ? (
                  <RecentTransactions transactions={recentTransactions} />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">No recent transactions</div>
                )}
              </div>
            </HoverCard>
          </div>
          <div key="sales-trend" className="p-2">
            <ChartWidget type="line" title="Sales Trend by Product" data={salesTrendData} options={chartOptions} />
          </div>
          <div key="stock-distribution" className="p-2">
            <ChartWidget type="bar" title="Stock Distribution" data={stockDistributionData} options={chartOptions} />
          </div>
        </ResponsiveGridLayout>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
