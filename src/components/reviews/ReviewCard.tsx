
import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MoreVertical, Flag, Shield, MessageSquare, Star, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewError } from '@/hooks/useReviewError';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

// Using a partial type for the review to support optimistic updates where we might not have all DB fields populated perfectly yet
type Review = Database['public']['Tables']['reviews']['Row'] & {
    vote_count?: number; // Calculated field
    has_voted?: boolean; // Calculated field 
    review_responses?: Database['public']['Tables']['review_responses']['Row'][];
    profiles?: { full_name: string; avatar_url: string; is_admin: boolean } | null;
};

interface ReviewCardProps {
    review: Review;
    onDelete?: (id: string) => void;
    onEdit?: (review: Review) => void;
    onReport?: (id: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onDelete, onEdit, onReport }) => {
    const { user } = useAuth();
    const { getErrorMessage } = useReviewError();
    const [isVoting, setIsVoting] = useState(false);
    const [localVoteCount, setLocalVoteCount] = useState(review.vote_count || 0);
    const [localHasVoted, setLocalHasVoted] = useState(review.has_voted || false);
    const [errorToast, setErrorToast] = useState<string | null>(null);

    // Calculate if review is editable (within 48 hours)
    const isEditable = useMemo(() => {
        if (!user || user.id !== review.user_id) return false;
        const createdAt = new Date(review.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 48;
    }, [review.created_at, review.user_id, user]);

    const canVote = user && user.id !== review.user_id;

    const handleVote = async () => {
        if (!user) return; // Should show login modal in real app
        if (isVoting || !canVote) return;

        setIsVoting(true);
        setErrorToast(null);

        // Optimistic update
        const newVoteState = !localHasVoted;
        const newCount = localVoteCount + (newVoteState ? 1 : -1);

        setLocalHasVoted(newVoteState);
        setLocalVoteCount(newCount);

        try {
            if (newVoteState) {
                const { error } = await supabase
                    .from('review_votes')
                    .insert({
                        review_id: review.id,
                        user_id: user.id,
                        vote_type: 'helpful'
                    });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('review_votes')
                    .delete()
                    .eq('review_id', review.id)
                    .eq('user_id', user.id);
                if (error) throw error;
            }
        } catch (error) {
            // Rollback
            setLocalHasVoted(!newVoteState);
            setLocalVoteCount(localVoteCount);
            setErrorToast(getErrorMessage(error));
        } finally {
            setIsVoting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            if (onDelete) onDelete(review.id);
            // Actual delete call happens in parent or here
            const { error } = await supabase.from('reviews').delete().eq('id', review.id);
            if (error) throw error;
        } catch (err) {
            setErrorToast(getErrorMessage(err));
        }
    };

    const isLegendary = review.rating === 5;

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative p-6 rounded-lg border-2 backdrop-blur-sm transition-all overflow-hidden group",
                isLegendary
                    ? "bg-black/40 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                    : "bg-surface/50 border-white/5 hover:border-white/10"
            )}
        >
            {/* Legendary Glow Effect */}
            {isLegendary && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                            {review.profiles?.avatar_url ? (
                                <img src={review.profiles.avatar_url} alt={review.profiles.full_name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                    {(review.profiles?.full_name || 'U').charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide text-foreground">
                                {review.profiles?.full_name || 'Anonymous Agent'}
                            </span>
                            {review.verified_purchase && (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                                    <Shield className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <time dateTime={review.created_at}>
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </time>
                            {review.edited_at && <span>(edited)</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Star Rating Display */}
                    <div className="flex" aria-label={`Rated ${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-4 h-4",
                                    star <= review.rating
                                        ? (isLegendary ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]" : "fill-primary text-primary")
                                        : "fill-muted/20 text-muted/20"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold mb-2 font-display uppercase tracking-tight">{review.title}</h3>

            <p className="text-foreground/80 leading-relaxed text-sm mb-4 whitespace-pre-wrap">
                {review.comment}
            </p>

            {/* Images Grid */}
            {review.images && review.images.length > 0 && (
                <div className={cn(
                    "grid gap-2 mb-4",
                    review.images.length === 1 ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
                )}>
                    {review.images.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded border border-white/10 overflow-hidden bg-black/50 relative group cursor-zoom-in">
                            <img
                                src={img}
                                alt={`Review attachment ${idx + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleVote}
                        disabled={!canVote || isVoting}
                        aria-pressed={localHasVoted}
                        aria-label={localHasVoted ? "Remove helpful vote" : "Mark review as helpful"}
                        className={cn(
                            "flex items-center gap-2 text-xs font-bold transition-colors",
                            localHasVoted ? "text-primary" : "text-muted-foreground hover:text-foreground",
                            !canVote && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <ThumbsUp className={cn("w-4 h-4", localHasVoted && "fill-current")} />
                        <span>Helpful ({localVoteCount})</span>
                    </button>
                    {!canVote && user && (
                        <span className="text-[10px] text-muted-foreground/50 hidden sm:inline-block">
                            (Cannot vote on own review)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditable && (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => onEdit?.(review)} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                <Edit2 className="w-3 h-3 mr-1.5" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 px-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onReport?.(review.id)} className="h-8 px-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10">
                        <Flag className="w-3 h-3 mr-1.5" /> Report
                    </Button>
                </div>
            </div>

            {/* Admin Response */}
            {review.review_responses && review.review_responses.length > 0 && (
                <div className="mt-4 mt-l-4 pl-4 border-l-2 border-primary/50 bg-primary/5 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Official Response</span>
                        <time className="text-[10px] text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(review.review_responses[0].created_at), { addSuffix: true })}
                        </time>
                    </div>
                    <p className="text-sm text-foreground/90 italic">
                        "{review.review_responses[0].response_text}"
                    </p>
                </div>
            )}

            {errorToast && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-3 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    {errorToast}
                </div>
            )}
        </motion.article>
    );
};
