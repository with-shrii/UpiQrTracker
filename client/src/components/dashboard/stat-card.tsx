import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, iconBgColor, iconColor, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1 font-medium">{title}</p>
          <h3 className="text-2xl font-bold font-poppins">{value}</h3>
          {trend && (
            <p className={`text-xs ${trend.isPositive ? 'text-secondary' : 'text-red-500'} flex items-center mt-1`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={trend.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} 
                />
              </svg>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} p-2 rounded-lg`}>
          <div className={`${iconColor} h-6 w-6`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
