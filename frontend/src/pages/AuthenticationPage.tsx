import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
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
import { Logo } from '@/components/ui/Logo';

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

    // Check if user is already authenticated and redirect to dashboard
    useEffect(() => {
        const checkExistingAuth = async () => {
            try {
                await authStore.checkAuth();
                if (authStore.isAuthenticated) {
                    navigate('/dashboard');
                }
            } catch (error) {
                // User is not authenticated, stay on auth page
                console.log('User not authenticated, showing login page');
            }
        };

        checkExistingAuth();
    }, [authStore, navigate]);

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
                    description:
                        error.message ||
                        'Something went wrong. Please try again.',
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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                </div>

                <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <div className="flex justify-center pt-4 pb-2"></div>

                    <CardHeader className="space-y-1 px-8 pt-2 pb-4">
                        <Logo />
                        <CardDescription className="text-center text-gray-600">
                            {isLogin
                                ? 'Enter your credentials to sign in to your account'
                                : 'Enter your details to create your new account'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-5"
                            >
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">
                                                Username
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your username"
                                                    className="h-11 border-gray-200 focus:border-[#644CEA] focus:ring-[#644CEA]/20 transition-all duration-200"
                                                    {...field}
                                                />
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
                                            <FormLabel className="text-sm font-medium text-gray-700">
                                                Password
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    className="h-11 border-gray-200 focus:border-[#644CEA] focus:ring-[#644CEA]/20 transition-all duration-200"
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
                                                <FormLabel className="text-sm font-medium text-gray-700">
                                                    Confirm Password
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Confirm your password"
                                                        className="h-11 border-gray-200 focus:border-[#644CEA] focus:ring-[#644CEA]/20 transition-all duration-200"
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
                                    className="w-full h-11 bg-gradient-to-r from-[#644CEA] to-purple-600 hover:from-purple-600 hover:to-[#644CEA] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
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

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">
                                            Or
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-11 text-[#644CEA] hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-200"
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
