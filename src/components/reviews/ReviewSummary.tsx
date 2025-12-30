
import React from 'react';
import { Star } from 'lucide-react';

interface ReviewSummaryProps {
    avgRating: number;
    totalReviews: number;
    distribution: {
        five: number;
        four: number;
        three: number;
        two: number;
        one: number;
    };
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ avgRating, totalReviews, distribution }) => {
    // Calculate percentages
    const getPercentage = (count: number) => totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    return (
        <div className="bg-card/30 p-6 rounded-lg border border-white/5 space-y-6">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-500 mb-2">
                    {avgRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                            key={s}
                            className={`w-5 h-5 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted/20 text-muted/20"}`}
                        />
                    ))}
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Based on {totalReviews} Reviews
                </p>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-6">
                {[
                    { stars: 5, count: distribution.five },
                    { stars: 4, count: distribution.four },
                    { stars: 3, count: distribution.three },
                    { stars: 2, count: distribution.two },
                    { stars: 1, count: distribution.one },
                ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3 text-xs">
                        <span className="w-8 font-bold text-right flex items-center justify-end gap-1">
                            {row.stars} <Star className="w-3 h-3 text-muted-foreground" />
                        </span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary/80 rounded-full transition-all duration-500"
                                style={{ width: `${getPercentage(row.count)}%` }}
                            />
                        </div>
                        <span className="w-8 text-muted-foreground font-mono tabular-nums text-right">
                            {row.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
