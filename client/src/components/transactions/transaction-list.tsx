import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction, QrCode } from '@shared/schema';
import { TransactionCard } from './transaction-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search } from 'lucide-react';

type FilterOption = 'all' | 'today' | 'week' | 'month';

interface TransactionListProps {
  userId: number;
}

export function TransactionList({ userId }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/transactions`],
  });

  // Fetch QR codes for cross-referencing
  const { data: qrCodes, isLoading: qrCodesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/qr-codes`],
  });

  // Get QR code name by ID
  const getQrCodeName = (qrCodeId: number): string => {
    if (!qrCodes) return '';
    const qrCode = qrCodes.find((qr: QrCode) => qr.id === qrCodeId);
    return qrCode ? qrCode.name : '';
  };

  // Filter transactions based on active filter
  const getFilteredTransactions = (): Transaction[] => {
    if (!transactions) return [];
    
    let filtered = [...transactions];
    
    // Apply search filter if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (t.payerName?.toLowerCase().includes(term) || false) || 
        (getQrCodeName(t.qrCodeId).toLowerCase().includes(term))
      );
    }
    
    // Apply time filter
    const now = new Date();
    
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(t => {
          const txDate = new Date(t.timestamp);
          return txDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        filtered = filtered.filter(t => {
          const txDate = new Date(t.timestamp);
          return txDate >= oneWeekAgo;
        });
        break;
      case 'month':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        filtered = filtered.filter(t => {
          const txDate = new Date(t.timestamp);
          return txDate >= oneMonthAgo;
        });
        break;
      default:
        // 'all' - no additional filtering needed
        break;
    }
    
    return filtered;
  };

  const isLoading = transactionsLoading || qrCodesLoading;
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-poppins">Recent Transactions</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="bg-gray-100 hover:bg-gray-200">
            <Filter className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div 
          className={`${
            activeFilter === 'all' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
          } rounded-full px-3 py-1 text-sm font-medium flex items-center`}
          onClick={() => setActiveFilter('all')}
        >
          <span>All</span>
        </div>
        <div 
          className={`${
            activeFilter === 'today' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
          } rounded-full px-3 py-1 text-sm font-medium flex items-center`}
          onClick={() => setActiveFilter('today')}
        >
          <span>Today</span>
        </div>
        <div 
          className={`${
            activeFilter === 'week' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
          } rounded-full px-3 py-1 text-sm font-medium flex items-center`}
          onClick={() => setActiveFilter('week')}
        >
          <span>Last Week</span>
        </div>
        <div 
          className={`${
            activeFilter === 'month' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
          } rounded-full px-3 py-1 text-sm font-medium flex items-center`}
          onClick={() => setActiveFilter('month')}
        >
          <span>Last Month</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading transactions...</div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction: Transaction) => (
            <TransactionCard 
              key={transaction.id} 
              transaction={transaction} 
              qrCodeName={getQrCodeName(transaction.qrCodeId)}
            />
          ))
        ) : (
          <div className="py-4 text-center text-gray-500">No transactions found</div>
        )}
      </div>
      
      {transactions && transactions.length > 5 && (
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary font-medium text-sm">
            View All Transactions
          </Button>
        </div>
      )}
    </div>
  );
}
