import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { OrdersSkeleton } from '@/components/ui/Skeletons';
import { Package, Search, Filter, ExternalLink, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/pricing';

type Order = any; // Will use DB types later

const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
    processing: 'bg-blue-500/20 text-blue-500 border-blue-500/20',
    shipped: 'bg-orange-500/20 text-orange-500 border-orange-500/20',
    delivered: 'bg-green-500/20 text-green-500 border-green-500/20',
    cancelled: 'bg-destructive/20 text-destructive border-destructive/20',
};

export const OrdersTab: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            // Guard clause: If no user, stop loading immediately
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Add execution timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 5000)
                );

                const dataPromise = supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            *,
                            product:products (name, image_url)
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
                toast.error('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchOrders();
        }
    }, [user, authLoading]);

    if (authLoading || loading) return <OrdersSkeleton />;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Link to="/login">
                    <Button>Please Login to View Orders</Button>
                </Link>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-white/5 p-6 rounded-full mb-6">
                    <Package size={48} className="text-muted-foreground opacity-20" />
                </div>
                <h2 className="text-2xl font-display font-bold tracking-tight">NO MISSIONS YET</h2>
                <p className="text-muted-foreground mt-2 max-w-xs">
                    Your gear deployment locker is empty. Start your first mission today.
                </p>
                <Button asChild className="mt-8 font-bold tracking-widest" variant="outline">
                    <Link to="/">BROWSE GEAR</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-bold">DEPLOYMENT HISTORY</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-white/5"><Filter size={18} /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5"><Search size={18} /></Button>
                </div>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative bg-white/2 hover:bg-white/5 border border-white/5 rounded-2xl p-6 transition-all duration-300"
                    >
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
                                        #{order.order_number}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tighter",
                                        statusColors[order.status as keyof typeof statusColors]
                                    )}>
                                        {order.status}
                                    </span>
                                </div>
                                <h3 className="font-bold flex items-center text-sm">
                                    <Clock size={12} className="mr-1 text-muted-foreground" />
                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </h3>
                            </div>

                            <div className="text-left sm:text-right">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Value</p>
                                <p className="text-lg font-display font-bold text-primary">
                                    {formatPrice(order.total_amount)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                            {order.order_items.map((item: any, idx: number) => (
                                <div key={idx} className="relative w-16 h-16 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 group-hover:border-primary/20 transition-colors">
                                    <img src={item.product?.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                    {item.quantity > 1 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                                            {item.quantity}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {order.order_items.length > 3 && (
                                <div className="text-xs font-bold text-muted-foreground pl-2 italic">
                                    +{order.order_items.length - 3} more
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                            <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary hover:neon-text flex items-center group/btn">
                                DETAILS <ChevronRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                            {order.status === 'shipped' && (
                                <Button size="sm" variant="outline" className="text-[10px] h-8 font-bold border-primary/20 hover:bg-primary/10">
                                    TRACK GEAR
                                </Button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
