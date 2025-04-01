import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { QrCode } from '@shared/schema';
import { QrCodeForm } from '@/components/qr-generator/qr-code-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Share2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Default user ID for demo purposes
const DEFAULT_USER_ID = 1;

export default function QrCodes() {
  const { toast } = useToast();
  
  // Fetch all QR codes for the user
  const { data: qrCodes, isLoading } = useQuery({
    queryKey: [`/api/users/${DEFAULT_USER_ID}/qr-codes`],
  });

  const downloadQrCode = (qrCode: QrCode) => {
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

  const copyQrLink = (qrCode: QrCode) => {
    navigator.clipboard.writeText(`upi://pay?pa=${qrCode.upiId}&pn=${encodeURIComponent(qrCode.name)}`);
    
    toast({
      title: "Link Copied",
      description: "UPI payment link copied to clipboard.",
    });
  };

  const shareQrCode = (qrCode: QrCode) => {
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
      copyQrLink(qrCode);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">My QR Codes</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage all your UPI QR codes
          </p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All QR Codes</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-8">Loading QR codes...</div>
          ) : qrCodes && qrCodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrCodes.map((qrCode: QrCode) => (
                <Card key={qrCode.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 pb-2">
                    <CardTitle className="text-lg">{qrCode.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex justify-center mb-4">
                      <div className="bg-white border border-gray-200 p-2 rounded-lg">
                        <img 
                          src={qrCode.qrData} 
                          alt={`QR Code for ${qrCode.name}`} 
                          className="h-32 w-32"
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">UPI ID:</span> {qrCode.upiId}
                      </div>
                      {qrCode.amount && (
                        <div>
                          <span className="font-medium">Amount:</span> ₹{Number(qrCode.amount).toFixed(2)}
                        </div>
                      )}
                      {qrCode.description && (
                        <div>
                          <span className="font-medium">Description:</span> {qrCode.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => downloadQrCode(qrCode)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => copyQrLink(qrCode)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => shareQrCode(qrCode)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium">No QR codes yet</h3>
              <p className="text-gray-500 mt-1">Create your first QR code to get started</p>
              <Button className="mt-4 bg-primary" onClick={() => document.querySelector('[data-value="create"]')?.click()}>
                Create QR Code
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create">
          <QrCodeForm userId={DEFAULT_USER_ID} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
