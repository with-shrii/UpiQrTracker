import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import QrCodes from "@/pages/qr-codes";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Layout component for protected routes
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row min-h-screen bg-background">
    <Sidebar />
    <main className="flex-1">{children}</main>
  </div>
);

function Router() {
  return (
    <Switch>
      <ProtectedRoute 
        path="/" 
        component={() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )} 
      />
      <ProtectedRoute 
        path="/qr-codes" 
        component={() => (
          <DashboardLayout>
            <QrCodes />
          </DashboardLayout>
        )} 
      />
      <ProtectedRoute 
        path="/transactions" 
        component={() => (
          <DashboardLayout>
            <Transactions />
          </DashboardLayout>
        )} 
      />
      <ProtectedRoute 
        path="/profile" 
        component={() => (
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        )} 
      />
      <ProtectedRoute 
        path="/settings" 
        component={() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
