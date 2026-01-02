import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminProductsTab } from './admin/tabs/AdminProductsTab';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Shield, LayoutDashboard, Package, TicketPercent, AlertTriangle } from 'lucide-react';
import { KPIStatsGrid } from './admin/components/KPIStatsGrid';
import { RevenueChart } from './admin/components/RevenueChart';
import { RecentActivityList } from './admin/components/RecentActivityList';
import { LowStockAlerts } from './admin/components/LowStockAlerts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const AdminDashboard = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Parallel fetch for simplified dashboard
                const [kpisRes, revenueRes, activityRes] = await Promise.all([
                    supabase.rpc('admin_get_kpis'),
                    supabase.rpc('admin_get_revenue_timeseries', { p_days: 30 }),
                    supabase.rpc('admin_get_recent_activity', { p_limit: 10 })
                ]);

                if (kpisRes.error) throw kpisRes.error;
                if (revenueRes.error) throw revenueRes.error;
                if (activityRes.error) throw activityRes.error;

                setKpis(kpisRes.data);
                setRevenueData(revenueRes.data || []);
                setRecentActivity(activityRes.data || []);

            } catch (error) {
                console.error('Dashboard fetch error:', error);
                toast.error('Failed to load dashboard metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* KPI Grid */}
            <KPIStatsGrid kpis={kpis} loading={loading} />

            {/* Charts & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Main Chart */}
                <RevenueChart data={revenueData} loading={loading} />

                {/* Right Column: Alerts & Activity */}
                <div className="col-span-4 lg:col-span-4 space-y-6">
                    <RecentActivityList activity={recentActivity} loading={loading} />
                    <LowStockAlerts />
                </div>
            </div>
        </div>
    );
};

export const AdminPage = () => {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer">
                                <Shield className="w-8 h-8 text-primary" />
                                ADMIN COMMAND CENTER
                            </Link>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, {profile?.full_name || 'Commander'}. Systems are online.
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut} className="gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </header>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold tracking-wider">
                            <LayoutDashboard className="h-4 w-4" />
                            OVERVIEW
                        </TabsTrigger>
                        <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold tracking-wider">
                            <Package className="h-4 w-4" />
                            INVENTORY
                        </TabsTrigger>
                        <TabsTrigger value="coupons" className="gap-2 opacity-50 cursor-not-allowed" disabled>
                            <TicketPercent className="h-4 w-4" />
                            COUPONS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <AdminDashboard />
                    </TabsContent>

                    <TabsContent value="products">
                        <AdminProductsTab />
                    </TabsContent>

                    <TabsContent value="coupons">
                        <div className="min-h-[400px] w-full flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg bg-card/50">
                            <TicketPercent className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground">Discount Module Offline</h3>
                            <p className="text-sm text-muted-foreground max-w-sm text-center mt-2">
                                The coupon management system is currently under development (Phase 2).
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-display font-bold text-primary text-sm">SYSTEM NOTIFICATION</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            This is a live operational dashboard. Ensure strict data governance.
                            Active RPC connections: <span className="font-mono text-primary">admin_get_kpis</span>, <span className="font-mono text-primary">admin_get_revenue_timeseries</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
