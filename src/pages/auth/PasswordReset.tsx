import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/FormInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

const resetSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const newPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Minimum 8 characters')
        .regex(/[A-Z]/, 'Must contain one uppercase')
        .regex(/[0-9]/, 'Must contain one number'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export const ForgotPasswordPage: React.FC = () => {
    const { resetPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await resetPassword(data.email);
            setSuccess(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl"
            >
                <Link to="/login" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={14} className="mr-1" />
                    BACK TO LOGIN
                </Link>

                {!success ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-display font-bold neon-text">RESET ACCESS</h2>
                            <p className="text-muted-foreground mt-2">
                                Enter your email to receive recovery instructions
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <FormInput
                                label="Registered Email"
                                placeholder="name@example.com"
                                error={errors.email?.message as string}
                                {...register('email')}
                            />
                            <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                                {loading ? 'SENDING...' : 'SEND RECOVERY LINK'}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-4">
                        <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-green-500">LINK SENT</h2>
                        <p className="text-muted-foreground">
                            If an account exists for that email, you will receive a reset link shortly.
                        </p>
                        <Button variant="outline" asChild className="w-full">
                            <Link to="/login">RETURN TO LOGIN</Link>
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export const ResetPasswordPage: React.FC = () => {
    const { updatePassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(newPasswordSchema),
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await updatePassword(data.password);
            setSuccess(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 glow-pulse">
                        <CheckCircle2 className="text-primary w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-display font-bold neon-text">ACCESS RESTORED</h2>
                    <p className="text-muted-foreground font-medium">
                        Your credentials have been updated successfully.
                    </p>
                    <Button asChild className="w-full h-12 text-lg font-bold">
                        <Link to="/login">LOGIN WITH NEW PASSWORD</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl"
            >
                <h2 className="text-2xl font-display font-bold neon-text mb-2">NEW CREDENTIALS</h2>
                <p className="text-muted-foreground mb-8">Establish a secure password for your guild account.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <FormInput
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message as string}
                        {...register('password')}
                    />
                    <FormInput
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.confirmPassword?.message as string}
                        {...register('confirmPassword')}
                    />
                    <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
                        {loading ? 'UPDATING...' : 'RESTORE ACCESS'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};
