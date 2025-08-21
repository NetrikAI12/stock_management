import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { Transaction } from '../../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.slice(0, 5).map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              transaction.type === 'inbound'
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              {transaction.type === 'inbound' ? (
                <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {transaction.itemName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {transaction.type === 'inbound' ? 'Added' : 'Distributed'} {transaction.quantity} units
                {transaction.transferredTo && ` to ${transaction.transferredTo}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(transaction.timestamp).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              by {transaction.userName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions;