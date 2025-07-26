import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

import { useLogin, useRegister } from '@/features/auth/hooks';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/features/auth/store';

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(3, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema
  .extend({
    confirmPassword: z
      .string()
      .min(3, 'Password must be at least 3 characters'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const AuthenticationPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const authStore = useAuthStore();

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
        const { user_id } = await loginMutation.mutateAsync({
          username,
          password,
        });

        authStore.stateLogin(user_id);

        toast('Logged in', {
          description: `Welcome back ${username}!`,
        });

        // Add little delay
        await new Promise(resolve => setTimeout(resolve, 500));

        form.reset();
        navigate('/dashboard');
      } else {
        const { username, password } = data as RegisterFormData;
        await registerMutation.mutateAsync({ username, password });

        toast('Account Created', {
          description: `Welcome ${username}! Your account has been created successfully.`,
        });

        form.reset();
        setIsLogin(true);
      }
    } catch (error) {
      // Handle Axios errors specifically
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          'An unexpected error occurred.';
        toast('Error', {
          description: errorMessage,
        });
      } else if (error instanceof Error) {
        // Handle generic JS errors
        toast('Error', {
          description: error.message || 'Something went wrong. Please try again.',
        });
      } else {
        // Handle unexpected non-error throws (e.g., strings)
        toast('Error', {
          description: 'An unknown error occurred.',
        });
      }

      console.error('Auth error:', error); // Helpful for debugging
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
                : 'Enter your details to create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
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
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? isLogin
                      ? 'Signing In...'
                      : 'Creating Account...'
                    : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={toggleMode}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AuthenticationPage;
