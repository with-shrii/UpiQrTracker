import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCodeDisplay } from './qr-code-display';

// Form validation schema
const qrCodeFormSchema = z.object({
  upiId: z.string().min(3, {
    message: "UPI ID must be at least 3 characters.",
  }),
  amount: z.string().optional(),
  description: z.string().optional(),
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  borderStyle: z.enum(["none", "simple", "rounded", "fancy"]).default("simple"),
});

type QrCodeFormValues = z.infer<typeof qrCodeFormSchema>;

interface QrCodeFormProps {
  userId: number;
}

export function QrCodeForm({ userId }: QrCodeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedQrCode, setGeneratedQrCode] = useState<any | null>(null);

  // Define form
  const form = useForm<QrCodeFormValues>({
    resolver: zodResolver(qrCodeFormSchema),
    defaultValues: {
      upiId: "",
      amount: "",
      description: "",
      name: "",
      size: "medium",
      borderStyle: "simple",
    },
  });

  // Create QR code mutation
  const createQrCodeMutation = useMutation({
    mutationFn: async (data: QrCodeFormValues) => {
      const payload = {
        ...data,
        userId,
        // Keep amount as string to match schema expectations
        amount: data.amount || '',
      };
      
      const response = await apiRequest('POST', '/api/qr-codes', payload);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQrCode(data);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/qr-codes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      toast({
        title: "QR Code Generated",
        description: "Your UPI QR code has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate QR code",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: QrCodeFormValues) {
    createQrCodeMutation.mutate(values);
  }

  // Verify UPI ID - in a real app, this would check against a UPI verification service
  const verifyUpiId = () => {
    const upiId = form.getValues('upiId');
    if (!upiId || upiId.length < 3) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      });
      return;
    }

    // Simple validation - in a real app, this would be a more robust check
    if (!upiId.includes('@')) {
      toast({
        title: "Invalid UPI ID",
        description: "UPI ID should be in format username@provider",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "UPI ID Verified",
      description: "Your UPI ID is valid.",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-xl font-bold font-poppins mb-4">Generate QR Code</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="upiId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID</FormLabel>
                <div className="flex">
                  <FormControl>
                    <Input 
                      placeholder="yourname@upi" 
                      {...field} 
                      className="rounded-r-none"
                    />
                  </FormControl>
                  <Button 
                    type="button" 
                    onClick={verifyUpiId} 
                    className="bg-primary hover:bg-primary/90 text-white rounded-l-none"
                  >
                    Verify
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Optional)</FormLabel>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₹</span>
                    </div>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-7" 
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Payment for..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>QR Code Name</FormLabel>
                <FormControl>
                  <Input placeholder="Store QR, Website Payment, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QR Size</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Small (200x200px)</SelectItem>
                      <SelectItem value="medium">Medium (300x300px)</SelectItem>
                      <SelectItem value="large">Large (400x400px)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="borderStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Border Style</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select border style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="fancy">Fancy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={createQrCodeMutation.isPending}
          >
            {createQrCodeMutation.isPending ? "Generating..." : "Generate QR Code"}
          </Button>
        </form>
      </Form>
      
      {generatedQrCode && (
        <QrCodeDisplay qrCode={generatedQrCode} />
      )}
    </div>
  );
}
