import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    order_id: string;
    order_number: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    created_at: string;
    user_full_name: string | null;
    user_email: string | null;
    user_avatar: string | null;
}

interface RecentActivityListProps {
    activity: ActivityItem[];
    loading: boolean;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activity, loading }) => {
    const getInitials = (name: string | null) => {
        return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
            case 'processing': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
        }
    };

    if (loading) {
        return (
            <Card className="col-span-4 lg:col-span-2 h-[400px] animate-pulse bg-card/50">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-muted" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-muted rounded" />
                                    <div className="h-3 w-1/4 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-4 lg:col-span-2 h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
                <div className="space-y-6">
                    {activity.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">No recent activity</div>
                    ) : (
                        activity.map((item) => (
                            <div key={item.order_id} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarImage src={item.user_avatar || ''} alt={item.user_full_name || 'User'} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(item.user_full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none text-foreground group-hover:text-primary transition-colors">
                                            {item.user_full_name || 'Anonymous User'}
                                        </p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <span className="font-mono mr-2">{item.order_number}</span>
                                            <span>•</span>
                                            <span className="ml-2">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium">{formatCurrency(item.total_amount)}</p>
                                        <p className={cn("text-xs", item.payment_status === 'paid' ? "text-emerald-500" : "text-yellow-500")}>
                                            {item.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className={cn("capitalize px-2 py-0.5", getStatusColor(item.status))}>
                                        {item.status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
import { cn } from '@/lib/utils';
