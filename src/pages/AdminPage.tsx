import { motion } from "framer-motion";
import { Shield, Users, ShoppingBag, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProductsTab } from "./admin/tabs/AdminProductsTab";

export function AdminPage() {
    const stats = [
        { label: "Total Users", value: "1,234", icon: Users, color: "text-blue-500" },
        { label: "Active Orders", value: "56", icon: ShoppingBag, color: "text-primary" },
        { label: "Revenue", value: "$12,450", icon: TrendingUp, color: "text-green-500" },
        { label: "Reports", value: "3", icon: AlertTriangle, color: "text-red-500" },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Shield className="w-8 h-8 text-primary" />
                            ADMIN COMMAND CENTER
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, Commander. Oversee the guild's operations.
                        </p>
                    </div>
                </header>

                <Tabs defaultValue="products" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold tracking-wider">OVERVIEW</TabsTrigger>
                        <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold tracking-wider">INVENTORY</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                                {stat.label}
                                            </CardTitle>
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold font-display">{stat.value}</div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Placeholder Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="bg-card/50 border-border/50">
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>Latest actions from users across the platform.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary">
                                                    U{i}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">New order placed by user_429</p>
                                                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                                                </div>
                                                <div className="text-xs font-mono text-primary">$124.99</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-card/50 border-border/50">
                                <CardHeader>
                                    <CardTitle>System Status</CardTitle>
                                    <CardDescription>Monitor infrastructure and API health.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                                            <span className="text-sm">Database Connection</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-500 font-bold">STABLE</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                                            <span className="text-sm">Auth Services</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-500 font-bold">ONLINE</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                                            <span className="text-sm">Storage (Avatars)</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-500 font-bold">LATENCY</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="products">
                        <AdminProductsTab />
                    </TabsContent>
                </Tabs>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-primary shrink-0" />
                    <div>
                        <h4 className="font-display font-bold text-primary">SYSTEM NOTIFICATION</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            This is a development dashboard. For production use, ensure Row-Level Security (RLS) policies
                            are strictly enforced on all administrative tables.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
