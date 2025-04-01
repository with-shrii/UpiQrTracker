import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  QrCode, 
  Receipt, 
  User,
  Settings,
  Menu,
  LogOut,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
};

const NavItem = ({ href, icon, title, isActive }: NavItemProps) => {
  return (
    <li>
      <Link href={href}>
        <div className={`flex items-center px-4 py-3 ${
          isActive 
            ? "text-primary bg-purple-50 border-r-4 border-primary" 
            : "text-gray-700 hover:bg-purple-50 hover:text-primary"
        }`}>
          <span className="mr-3">{icon}</span>
          {title}
        </div>
      </Link>
    </li>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    { href: '/', icon: <LayoutDashboard className="h-5 w-5" />, title: 'Dashboard' },
    { href: '/qr-codes', icon: <QrCode className="h-5 w-5" />, title: 'My QR Codes' },
    { href: '/transactions', icon: <Receipt className="h-5 w-5" />, title: 'Transactions' },
    { href: '/profile', icon: <User className="h-5 w-5" />, title: 'Profile' },
    { href: '/settings', icon: <Settings className="h-5 w-5" />, title: 'Settings' },
  ];
  
  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between">
        <button onClick={toggleMobileMenu} className="text-textColor">
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <div className="bg-primary text-white p-1.5 rounded-full mr-2">
            <QrCode className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold font-poppins">UPI QR Tracker</h1>
        </div>
        <div className="w-6"></div> {/* Spacer for centering */}
      </header>
    
      {/* Sidebar */}
      <div 
        className={`w-64 bg-white shadow-md md:flex flex-col h-full fixed md:sticky top-0 bottom-0 left-0 z-40 transition-transform duration-300 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center p-4 border-b">
            <div className="bg-primary text-white p-2 rounded-full mr-2">
              <QrCode className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold font-poppins">UPI QR Tracker</h1>
          </div>
          
          <nav className="py-4 flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <NavItem 
                  key={item.href} 
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  isActive={location === item.href}
                />
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-sm">{user?.fullName || user?.username || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}
