import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/FormInput';
import { Checkbox } from '@/components/ui/checkbox';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { motion } from 'framer-motion';

const signupSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms & conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: false,
        }
    });

    const password = watch('password', '');

    const onSubmit = async (data: SignupForm) => {
        setLoading(true);
        console.log('Submitting form data:', data);
        try {
            await signUp(data.email, data.password, data.fullName);
            setSuccess(true);
        } catch (error) {
            console.error('Signup error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md text-center space-y-6 bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-primary/20 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-display font-bold neon-text">DEPLOYMENT INITIATED</h2>
                    <p className="text-muted-foreground text-lg">
                        Check your inbox to verify your account and join the guild.
                    </p>
                    <Button
                        asChild
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 font-display"
                    >
                        <Link to="/login">PROCEED TO LOGIN</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-[radial-gradient(circle_at_center,rgba(255,0,85,0.05)_0%,transparent_70%)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
            >
                <div className="text-center relative">
                    <h2 className="text-3xl font-display font-bold tracking-tight neon-text-pink">
                        JOIN THE GUILD
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Register to start your legend
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 relative">
                    <FormInput
                        label="Full Name"
                        placeholder="Agent J"
                        error={errors.fullName?.message}
                        {...register('fullName')}
                    />

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
                        <PasswordStrength password={password} />
                    </div>

                    <FormInput
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />

                    <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                            <Controller
                                name="terms"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="terms"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms"
                                    className="text-xs font-medium text-muted-foreground cursor-pointer"
                                >
                                    I accept the Guild's terms of service and privacy policy
                                </label>
                                {errors.terms && (
                                    <p className="text-[10px] text-destructive italic">{errors.terms.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 group relative overflow-hidden"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10 text-lg tracking-wider">CREATE ACCOUNT</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                            </>
                        )}
                    </Button>

                    <SocialLogin />

                    <p className="text-center text-sm text-muted-foreground pt-4">
                        Already a member?{' '}
                        <Link
                            to="/login"
                            className="font-bold text-accent hover:text-accent/80 transition-colors"
                        >
                            LOGIN
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};
