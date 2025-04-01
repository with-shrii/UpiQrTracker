import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QrCodeForm } from '@/components/qr-generator/qr-code-form';
import { TransactionList } from '@/components/transactions/transaction-list';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Receipt, 
  QrCode, 
  CircleDollarSign,
  Users,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/qr-utils';

// Default user ID for demo purposes
const DEFAULT_USER_ID = 1;

export default function Dashboard() {
  const queryClient = useQueryClient();
  
  // Create demo data mutation
  const createDemoDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/demo-data', {});
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries after creating demo data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${DEFAULT_USER_ID}/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${DEFAULT_USER_ID}/qr-codes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${DEFAULT_USER_ID}/transactions`] });
    }
  });

  // Fetch stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/users/${DEFAULT_USER_ID}/stats`],
  });

  // Load demo data if not already loaded
  useEffect(() => {
    if (!isLoading && (!stats || stats.totalTransactions === 0)) {
      createDemoDataMutation.mutate();
    }
  }, [isLoading, stats]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">Dashboard</h1>
          <p className="text-gray-600 text-sm md:text-base">Create and manage your UPI QR codes</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
          <Plus className="h-5 w-5 mr-2" />
          New QR Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Payments" 
          value={isLoading ? "Loading..." : `₹${formatCurrency(stats?.totalPayments || 0)}`}
          icon={<CircleDollarSign />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          trend={{
            value: "+12.5% from last month",
            isPositive: true
          }}
        />
        
        <StatCard 
          title="Active QR Codes" 
          value={isLoading ? "Loading..." : stats?.activeQrCodes || 0}
          icon={<QrCode />}
          iconBgColor="bg-accent/10"
          iconColor="text-accent"
          trend={{
            value: "+2 new this week",
            isPositive: true
          }}
        />
        
        <StatCard 
          title="Transactions" 
          value={isLoading ? "Loading..." : stats?.totalTransactions || 0}
          icon={<Receipt />}
          iconBgColor="bg-secondary/10"
          iconColor="text-secondary"
          trend={{
            value: "+18 this month",
            isPositive: true
          }}
        />
        
        <StatCard 
          title="Unique Payers" 
          value={isLoading ? "Loading..." : stats?.uniquePayers || 0}
          icon={<Users />}
          iconBgColor="bg-purple-100"
          iconColor="text-primary"
          trend={{
            value: "+5 new payers",
            isPositive: true
          }}
        />
      </div>

      {/* Main Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QrCodeForm userId={DEFAULT_USER_ID} />
        <TransactionList userId={DEFAULT_USER_ID} />
      </div>
    </div>
  );
}
