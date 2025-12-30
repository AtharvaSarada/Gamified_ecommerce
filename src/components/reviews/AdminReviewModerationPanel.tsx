
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext'; // Assuming this context exists
import { Shield, AlertTriangle, Check, X, MessageSquare, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Report = Database['public']['Tables']['review_reports']['Row'] & {
    reviews: Database['public']['Tables']['reviews']['Row'] & {
        profiles: { full_name: string; email: string } | null;
    };
    profiles: { full_name: string } | null; // Reporter
};

export const AdminReviewModerationPanel: React.FC = () => {
    const { user } = useAuth(); // Need to check if user is admin, assume context handles or we check profile
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
    const [replyText, setReplyText] = useState<Record<string, string>>({}); // reviewId -> text
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('review_reports')
            .select(`
                *,
                reviews (
                    *,
                    profiles (full_name)
                ),
                profiles:reporter_user_id (full_name)
            `)
            .eq('status', filter)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReports(data as any);
        }
        setIsLoading(false);
    };

    const handleAction = async (reportId: string, action: 'resolve' | 'dismiss', reviewId?: string) => {
        // Update report status
        const { error } = await supabase
            .from('review_reports')
            .update({
                status: action === 'resolve' ? 'resolved' : 'dismissed',
                resolved_at: new Date().toISOString()
            })
            .eq('id', reportId);

        if (!error) {
            // Remove locally
            setReports(prev => prev.filter(r => r.id !== reportId));

            // If resolving (e.g. taking action against review), maybe delete review?
            // For now, 'resolve' just marks report as handled. Delete is separate button.
        }
    };

    const handleDeleteReview = async (reviewId: string, reportId: string) => {
        if (!confirm("Are you sure you want to delete this review? This cannot be undone.")) return;

        // Delete review (cascade will handle reports/votes)
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

        if (!error) {
            setReports(prev => prev.filter(r => r.review_id !== reviewId));
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!replyText[reviewId] || !user) return;

        const { error } = await supabase.from('review_responses').insert({
            review_id: reviewId,
            responder_user_id: user.id,
            response_text: replyText[reviewId]
        });

        if (!error) {
            setActiveReplyId(null);
            setReplyText(prev => ({ ...prev, [reviewId]: '' }));
            alert("Response sent!");
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading reports...</div>;

    return (
        <div className="space-y-6 p-6 bg-card rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-display uppercase flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" /> Moderation Console
                </h2>
                <div className="flex gap-2">
                    {(['pending', 'resolved', 'dismissed'] as const).map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className="capitalize"
                        >
                            {f}
                        </Button>
                    ))}
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-white/5 rounded">
                    No {filter} reports found. All clear!
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-background/50 border border-white/5 p-4 rounded-lg space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-destructive/20 text-destructive border border-destructive/20">
                                            {report.reason}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Reported by {report.profiles?.full_name || 'Anonymous'} • {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground/80">"{report.description || 'No description provided'}"</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" title="Resolve (Keep Review)" onClick={() => handleAction(report.id, 'dismiss')}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Delete Review" onClick={() => handleDeleteReview(report.reviews.id, report.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" title="Reply to Review" onClick={() => setActiveReplyId(activeReplyId === report.reviews.id ? null : report.reviews.id)}>
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="pl-4 border-l-2 border-white/10">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Review Content</h4>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm">{report.reviews.rating}★</span>
                                    <span className="font-bold text-sm">{report.reviews.title}</span>
                                </div>
                                <p className="text-sm text-foreground/70 italic">"{report.reviews.comment}"</p>
                            </div>

                            {activeReplyId === report.reviews.id && (
                                <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        value={replyText[report.reviews.id] || ''}
                                        onChange={(e) => setReplyText(prev => ({ ...prev, [report.reviews.id]: e.target.value }))}
                                        placeholder="Admin response..."
                                        className="flex-1 bg-background border border-white/10 rounded px-3 py-2 text-sm"
                                    />
                                    <Button size="sm" onClick={() => handleReply(report.reviews.id)}>Send</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
