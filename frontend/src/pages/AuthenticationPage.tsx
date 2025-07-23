import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Toaster } from "@/components/ui/sonner"

import { useLogin, useRegister } from '@/features/auth/hooks';
import type { LoginResponse } from '@/features/auth/types';

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(3, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(3, 'Password must be at least 3 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const AuthenticationPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '', // Always include confirmPassword
    },
    mode: 'onSubmit', // Validate on blur for better UX
  });

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    try {
      if (isLogin) {
        const { username, password } = data as LoginFormData;
        const { user_id, access_token, refresh_token } = await loginMutation.mutateAsync({ username, password });

        console.log(user_id, access_token, refresh_token);

        toast("Logged in", {
          description: `Welcome back ${username}!`,});
      } else {
        // Call the register mutation
        const { username, password } = data as RegisterFormData;
        await registerMutation.mutateAsync({ username, password });

        toast("Account Created", {
          description: `Welcome ${username}! Your account has been created successfully.`,
        });

        form.reset();
      }
    } catch (error) {
      toast("Error", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const toggleMode = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    form.reset({
      username: '',
      password: '',
      confirmPassword: '', // Always reset confirmPassword
    });
    // The resolver will automatically update based on the new isLogin state
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Enter your credentials to sign in' 
                : 'Enter your details to create your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting 
                    ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                    : (isLogin ? 'Sign In' : 'Create Account')
                  }
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full"
                  onClick={toggleMode}
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
};

export default AuthenticationPage;