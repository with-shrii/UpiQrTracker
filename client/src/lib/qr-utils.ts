import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Format date for display in transaction cards
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else if (date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    // Less than a week ago
    return formatDistanceToNow(date, { addSuffix: true });
  } else {
    return format(date, 'MMM d, h:mm a');
  }
}

// Generate a downloadable UPI link
export function generateUpiLink(upiId: string, name?: string, amount?: number, desc?: string): string {
  let link = `upi://pay?pa=${upiId}`;
  
  if (name) {
    link += `&pn=${encodeURIComponent(name)}`;
  }
  
  if (amount) {
    link += `&am=${amount}`;
  }
  
  if (desc) {
    link += `&tn=${encodeURIComponent(desc)}`;
  }
  
  link += '&cu=INR';
  return link;
}

// Format currency for display
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(numAmount).replace('₹', '₹ ');
}
