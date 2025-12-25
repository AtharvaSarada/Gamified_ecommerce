import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your credentials...');

    useEffect(() => {
        const handleVerification = async () => {
            // Supabase handles the token in the URL automatically on initial load if configured,
            // but we can also manually check or wait for the session.
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                setStatus('success');
                setMessage('Your email has been successfully verified! You can now access all guild features.');
            } else if (error) {
                setStatus('error');
                setMessage(error.message || 'The verification link is invalid or has expired.');
            } else {
                // Fallback or wait
                const timeout = setTimeout(() => {
                    if (status === 'loading') {
                        setStatus('error');
                        setMessage('Verification timed out. Please try logging in.');
                    }
                }, 5000);
                return () => clearTimeout(timeout);
            }
        };

        handleVerification();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center p-8 bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
            >
                {status === 'loading' && (
                    <div className="space-y-6">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                        <h2 className="text-2xl font-display font-bold neon-text">VERIFYING...</h2>
                        <p className="text-muted-foreground">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="text-primary w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-display font-bold neon-text">ACCESS GRANTED</h2>
                        <p className="text-muted-foreground">{message}</p>
                        <Button asChild className="w-full py-6 font-bold">
                            <Link to="/">PROCEED TO MISSION</Link>
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="bg-destructive/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="text-destructive w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-destructive">VERIFICATION FAILED</h2>
                        <p className="text-muted-foreground">{message}</p>
                        <div className="space-y-3">
                            <Button asChild className="w-full py-6 font-bold">
                                <Link to="/login">BACK TO LOGIN</Link>
                            </Button>
                            <Button variant="ghost" asChild className="text-muted-foreground text-xs">
                                <Link to="/signup">RE-REGISTER</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export const EmailVerificationBanner: React.FC = () => {
    const { user, profile } = useAuth();
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (resending || cooldown > 0 || !user?.email) return;

        setResending(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email,
        });

        if (error) {
            toast.error('Failed to resend verification email');
        } else {
            toast.success('Verification email resent!');
            setCooldown(60);
        }
        setResending(false);
    };

    if (!user || user.email_confirmed_at) return null;

    return (
        <div className="bg-destructive/10 border-b border-destructive/20 text-destructive-foreground py-2 px-4 relative z-50">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle size={16} className="text-destructive animate-pulse" />
                    <span>YOUR ACCOUNT IS LIMITED. PLEASE VERIFY YOUR EMAIL TO UNLOCK ALL FEATURES.</span>
                </div>
                <button
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest hover:underline disabled:opacity-50 disabled:no-underline"
                >
                    {resending ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <RefreshCw size={12} className={cn(cooldown > 0 && "animate-spin-slow")} />
                    )}
                    {cooldown > 0 ? `RESEND IN ${cooldown}S` : 'RESEND VERIFICATION'}
                </button>
            </div>
        </div>
    );
};
