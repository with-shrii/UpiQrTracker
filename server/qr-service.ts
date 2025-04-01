import QRCode from 'qrcode';

export interface QRCodeOptions {
  upiId: string;
  name?: string;
  amount?: string;
  description?: string;
  size?: string;
  borderStyle?: string;
}

export interface GeneratedQRCode {
  data: string;
  upiUrl: string;
  size: string;
  borderStyle: string;
}

export class QRCodeService {
  private getPixelSize(size: string): number {
    switch (size) {
      case 'small':
        return 200;
      case 'large':
        return 400;
      case 'medium':
      default:
        return 300;
    }
  }

  private getBorderStyle(style: string): any {
    switch (style) {
      case 'none':
        return {};
      case 'rounded':
        return { 
          color: { light: '#ffffff', dark: '#6C63FF' },
          width: 2
        };
      case 'fancy':
        return {
          color: { light: '#ffffff', dark: '#6C63FF' },
          width: 4
        };
      case 'simple':
      default:
        return {
          color: { light: '#ffffff', dark: '#2D3436' },
          width: 1
        };
    }
  }

  private generateUpiUrl(options: QRCodeOptions): string {
    let url = `upi://pay?pa=${options.upiId}`;
    
    // Add optional parameters
    if (options.name) {
      url += `&pn=${encodeURIComponent(options.name)}`;
    }
    
    if (options.amount) {
      url += `&am=${options.amount}`;
    }
    
    if (options.description) {
      url += `&tn=${encodeURIComponent(options.description)}`;
    }
    
    // Add currency - INR is the default for UPI
    url += '&cu=INR';
    
    return url;
  }

  public async generateQRCode(options: QRCodeOptions): Promise<GeneratedQRCode> {
    const size = options.size || 'medium';
    const borderStyle = options.borderStyle || 'simple';
    const pixelSize = this.getPixelSize(size);
    const qrOptions = this.getBorderStyle(borderStyle);
    
    // Generate UPI URL
    const upiUrl = this.generateUpiUrl(options);
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      width: pixelSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: qrOptions.color,
    });
    
    return {
      data: qrDataUrl,
      upiUrl,
      size,
      borderStyle
    };
  }
}

export const qrCodeService = new QRCodeService();
