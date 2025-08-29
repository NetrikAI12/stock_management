// components/Dashboard/StockChart.tsx
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface StockChartProps {
  data: { name: string; value: number }[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {item.value} items
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%',
                backgroundColor: colors[index % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockChart;