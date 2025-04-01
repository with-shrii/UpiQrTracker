import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react';

// Default user ID for demo purposes
const DEFAULT_USER_ID = 1;

export default function Profile() {
  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${DEFAULT_USER_ID}`],
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">Profile</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage your account information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium">
                {isLoading ? "Loading..." : user?.fullName || "User"}
              </h3>
              <p className="text-gray-500 text-sm">
                {isLoading ? "Loading..." : user?.email || "email@example.com"}
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Change Profile Picture
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName"
                      defaultValue={isLoading ? "" : user?.fullName || ""}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      defaultValue={isLoading ? "" : user?.username || ""}
                      placeholder="Your username"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      defaultValue={isLoading ? "" : user?.email || ""}
                      placeholder="Your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input 
                      id="upiId"
                      defaultValue={isLoading ? "" : user?.upiId || ""}
                      placeholder="yourname@upi"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="bg-primary">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
