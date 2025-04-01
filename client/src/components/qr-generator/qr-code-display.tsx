import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Download,
  Copy,
  Share2
} from 'lucide-react';
import { QrCode } from '@shared/schema';

interface QrCodeDisplayProps {
  qrCode: QrCode;
}

export function QrCodeDisplay({ qrCode }: QrCodeDisplayProps) {
  const { toast } = useToast();

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
      
      <div className="flex flex-wrap gap-2 justify-center">
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
    </div>
  );
}
