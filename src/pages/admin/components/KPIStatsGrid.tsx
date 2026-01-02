import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus, Users, ShoppingBag, IndianRupee, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// Using types derived from our RPC return type
interface KPIs {
    revenue: {
        total: number;
        today: number;
        last_30d: number;
        trend: {
            value: number;
            direction: 'up' | 'down' | 'flat';
            details?: string;
        };
    };
    active_orders: number;
    users: {
        total: number;
        new_today: number;
    };
}

interface KPIStatsGridProps {
    kpis: KPIs | null;
    loading: boolean;
}

export const KPIStatsGrid: React.FC<KPIStatsGridProps> = ({ kpis, loading }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const stats = [
        {
            title: 'Total Revenue',
            value: kpis ? formatCurrency(kpis.revenue.total) : '₹0',
            subValue: kpis ? `+${formatCurrency(kpis.revenue.today)} today` : 'Loading...',
            icon: IndianRupee,
            trend: kpis?.revenue.trend,
            color: 'text-emerald-500',
        },
        {
            title: 'Active Orders',
            value: kpis ? kpis.active_orders.toString() : '0',
            subValue: 'Pending fulfillment',
            icon: ShoppingBag,
            color: 'text-blue-500',
        },
        {
            title: 'Total Users',
            value: kpis ? kpis.users.total.toString() : '0',
            subValue: kpis ? `+${kpis.users.new_today} today` : 'Loading...',
            icon: Users,
            color: 'text-purple-500',
        },
        {
            title: 'Monthly Revenue',
            value: kpis ? formatCurrency(kpis.revenue.last_30d) : '₹0',
            subValue: 'Last 30 Days',
            icon: Activity,
            color: 'text-orange-500',
        },
    ];

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse bg-card/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-4 w-4 bg-muted rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-32 bg-muted rounded mb-2" />
                            <div className="h-3 w-16 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="bg-card border-border/50 hover:border-border transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            {stat.trend && (
                                <span className={cn(
                                    "flex items-center mr-2",
                                    stat.trend.direction === 'up' ? "text-emerald-500" :
                                        stat.trend.direction === 'down' ? "text-red-500" : "text-muted-foreground"
                                )}>
                                    {stat.trend.direction === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                    {stat.trend.direction === 'down' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {stat.trend.direction === 'flat' && <Minus className="h-3 w-3 mr-1" />}
                                    {stat.trend.details || `${Math.abs(stat.trend.value)}%`}
                                </span>
                            )}
                            {!stat.trend && stat.subValue}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
