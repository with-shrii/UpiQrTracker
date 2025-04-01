import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TransactionList } from '@/components/transactions/transaction-list';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Filter } from 'lucide-react';

// Default user ID for demo purposes
const DEFAULT_USER_ID = 1;

export default function Transactions() {
  // Fetch transactions to get total amount and count
  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/api/users/${DEFAULT_USER_ID}/transactions`],
  });

  const getTotalAmount = () => {
    if (!transactions) return 0;
    return transactions.reduce((total: number, tx: any) => 
      total + Number(tx.amount), 0);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">Transactions</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage and track your UPI payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white p-4 rounded-xl mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
            <p className="text-2xl font-bold mt-1">
              {isLoading ? "Loading..." : transactions?.length || 0}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="text-2xl font-bold mt-1">
              {isLoading ? "Loading..." : `₹${getTotalAmount().toFixed(2)}`}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Average Transaction</h3>
            <p className="text-2xl font-bold mt-1">
              {isLoading ? "Loading..." : transactions?.length 
                ? `₹${(getTotalAmount() / transactions.length).toFixed(2)}`
                : "₹0.00"}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList userId={DEFAULT_USER_ID} />
    </div>
  );
}
