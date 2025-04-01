import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Transaction } from '@shared/schema';
import { formatDate } from '@/lib/qr-utils';

interface TransactionCardProps {
  transaction: Transaction;
  qrCodeName?: string;
}

export function TransactionCard({ transaction, qrCodeName }: TransactionCardProps) {
  return (
    <div className="transaction-card bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <ArrowUp className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Payment Received</h4>
            <div className="flex items-center mt-1">
              <p className="text-xs text-gray-500 mr-2">
                From: {transaction.payerName || 'Unknown'}
              </p>
              {qrCodeName && (
                <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                  {qrCodeName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-secondary">+ ₹{Number(transaction.amount).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}
