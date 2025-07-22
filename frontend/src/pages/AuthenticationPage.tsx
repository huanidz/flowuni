import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AuthenticationPage = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {isLoginForm ? 'Welcome back' : 'Create account'}
          </CardTitle>
          <CardDescription>
            {isLoginForm 
              ? 'Enter your credentials to sign in' 
              : 'Enter your details to create your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Enter your username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>
          <Button className="w-full">
            {isLoginForm ? 'Sign In' : 'Create Account'}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setIsLoginForm(!isLoginForm)}
          >
            {isLoginForm ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthenticationPage;