
import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useReviewError } from '@/hooks/useReviewError';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviewId: string;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({ isOpen, onClose, reviewId }) => {
    const { user } = useAuth();
    const { getErrorMessage } = useReviewError();
    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus Trap
    useEffect(() => {
        if (!isOpen) return;
        const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable && focusable.length > 0) {
            (focusable[0] as HTMLElement).focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase.from('review_reports').insert({
                review_id: reviewId,
                reporter_user_id: user.id,
                reason,
                description,
                status: 'pending'
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setDescription('');
            }, 2000);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className="relative w-full md:max-w-md bg-card border-t border-x md:border border-white/10 rounded-t-2xl md:rounded-lg p-6 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold font-display uppercase flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" /> Report Review
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full" aria-label="Close modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="py-12 text-center space-y-4 animate-in fade-in">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-500">
                            <span className="text-2xl">✓</span>
                        </div>
                        <h3 className="font-bold">Report Submitted</h3>
                        <p className="text-sm text-muted-foreground">Thank you for helping keep our community clean. Our moderators will review this shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Reason</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-background border border-white/10 rounded p-3 focus:border-primary focus:outline-none"
                            >
                                <option value="spam">Spam or Advertising</option>
                                <option value="harassment">Harassment or Hate Speech</option>
                                <option value="inappropriate">Inappropriate Content</option>
                                <option value="fake">Fake Review / Not a Customer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Details (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please provide more context..."
                                className="w-full bg-background border border-white/10 rounded p-3 min-h-[100px] focus:border-primary focus:outline-none resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" className="flex-1" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};
