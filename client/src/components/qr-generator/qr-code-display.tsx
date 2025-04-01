import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Download,
  Copy,
  Share2,
  CreditCard
} from 'lucide-react';
import { QrCode } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QrCodeDisplayProps {
  qrCode: QrCode;
}

export function QrCodeDisplay({ qrCode }: QrCodeDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(qrCode.amount || '');
  const [payerName, setPayerName] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/transactions', paymentData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${qrCode.userId}/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${qrCode.userId}/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/qr-codes/${qrCode.id}/transactions`] });
      
      toast({
        title: "Payment Successful",
        description: `₹${paymentAmount} has been received from ${payerName}.`,
      });
      
      // Close payment dialog and reset fields
      setShowPaymentDialog(false);
      setPayerName('');
      setPayerUpiId('');
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle payment submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentAmount || !payerName || !payerUpiId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    createTransactionMutation.mutate({
      qrCodeId: qrCode.id,
      amount: paymentAmount,
      payerName,
      payerUpiId,
      status: "completed",
      metadata: {}
    });
  };

  const downloadQrCode = () => {
    const link = document.createElement('a');
    link.href = qrCode.qrData;
    link.download = `${qrCode.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been downloaded successfully.",
    });
  };

  const copyQrLink = () => {
    // In a real app, we would generate a shareable link
    // For now, we'll just copy the UPI ID
    navigator.clipboard.writeText(`upi://pay?pa=${qrCode.upiId}&pn=${encodeURIComponent(qrCode.name)}`);
    
    toast({
      title: "Link Copied",
      description: "UPI payment link copied to clipboard.",
    });
  };

  const shareQrCode = () => {
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: `UPI QR Code: ${qrCode.name}`,
        text: `Scan this QR code to pay with UPI: ${qrCode.upiId}`,
        url: window.location.href,
      })
        .then(() => {
          toast({
            title: "Shared Successfully",
            description: "Your QR code has been shared.",
          });
        })
        .catch((error) => {
          toast({
            title: "Share Failed",
            description: "Could not share QR code.",
            variant: "destructive",
          });
        });
    } else {
      // Fallback to copy
      copyQrLink();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-center mb-4">
        <div className="qr-code-wrapper bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center w-64 h-64">
          <img src={qrCode.qrData} alt={`QR Code for ${qrCode.name}`} className="w-48 h-48" />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <Button
          onClick={downloadQrCode}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Download className="h-5 w-5 mr-2" />
          Download QR
        </Button>
        
        <Button
          onClick={copyQrLink}
          variant="outline"
          className="bg-white hover:bg-gray-50 text-textColor border-gray-300"
        >
          <Copy className="h-5 w-5 mr-2" />
          Copy Link
        </Button>
        
        <Button
          onClick={shareQrCode}
          className="bg-accent hover:bg-accent/90 text-white"
        >
          <Share2 className="h-5 w-5 mr-2" />
          Share QR
        </Button>
      </div>

      {/* Simulate payment button - only for demo purposes */}
      <div className="mt-3 border-t pt-3 text-center">
        <Button
          onClick={() => setShowPaymentDialog(true)}
          variant="outline"
          className="bg-white hover:bg-gray-50 text-primary border-primary border-dashed"
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Simulate Payment
        </Button>
      </div>
      
      {/* Payment simulation dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Simulate UPI Payment</DialogTitle>
            <DialogDescription>
              Fill in the details to simulate a payment to this QR code.
              This is for demonstration purposes only.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePaymentSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <Input
                  id="amount"
                  type="text" 
                  className="pl-7"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payerName">Payer Name</Label>
              <Input
                id="payerName"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payerUpiId">Payer UPI ID</Label>
              <Input
                id="payerUpiId"
                value={payerUpiId}
                onChange={(e) => setPayerUpiId(e.target.value)}
                placeholder="username@upi"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending ? "Processing..." : "Pay Now"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
