import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/FormInput';
import { Checkbox } from '@/components/ui/checkbox';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { motion } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
    const { signIn, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [localLoading, setLocalLoading] = React.useState(false);

    const from = location.state?.from?.pathname || '/';

    // Auto-redirect if user is already authenticated
    React.useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        }
    });

    const onSubmit = async (data: LoginForm) => {
        setLocalLoading(true);
        try {
            await signIn(data.email, data.password);
            // Redirection is handled by the useEffect above
        } catch (error) {
            console.error('Login error:', error);
            // Error toast is handled in AuthContext.signIn
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,rgba(0,255,240,0.05)_0%,transparent_70%)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
            >
                {/* Glow Effects */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

                <div className="text-center relative">
                    <h2 className="text-3xl font-display font-bold tracking-tight neon-text">
                        WELCOME BACK
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Sign in to access your gear
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 relative">
                    <FormInput
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <div className="space-y-1">
                        <FormInput
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Controller
                            name="rememberMe"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="rememberMe"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <label
                            htmlFor="rememberMe"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer"
                        >
                            Remember me
                        </label>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 group relative overflow-hidden"
                        disabled={localLoading}
                    >
                        {localLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10 text-lg tracking-wider">INITIATE LOGIN</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                            </>
                        )}
                    </Button>

                    <SocialLogin />

                    <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                            SIGN UP
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};
