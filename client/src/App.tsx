import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <h1 className="text-4xl font-bold mb-8 text-primary">UPI QR Tracker</h1>
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome to the UPI QR Code Tracker</h2>
          <p className="mb-4">
            This application helps you generate and track UPI QR codes for payments.
          </p>
          <div className="flex justify-center">
            <button 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
              onClick={() => alert('Feature will be available soon!')}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
