import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package, Truck, Calendar, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/utils/pricing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Helper for status colors
const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
        case 'processing': return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
        case 'shipped': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
        case 'delivered': return 'text-green-500 border-green-500/20 bg-green-500/10';
        case 'cancelled': return 'text-destructive border-destructive/20 bg-destructive/10';
        default: return 'text-muted-foreground border-white/10 bg-white/5';
    }
};

export const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!user || !orderId) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        shipping_address:shipping_addresses(*),
                        order_items (
                            *,
                            product:products (name, images, id, base_price)
                        )
                    `)
                    .eq('id', orderId)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (error) {
                console.error('Error fetching order:', error);
                toast.error('Failed to load mission details.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [user, orderId]);

    const handleCancelOrder = async () => {
        if (!confirm('Are you sure you want to abort this mission? This action cannot be undone.')) return;

        try {
            setCancelling(true);
            const { error } = await (supabase.rpc as any)('cancel_order', {
                p_order_id: orderId,
                p_reason: 'User requested cancellation via portal'
            });

            if (error) throw error;

            toast.success('Mission Aborted. Refund process initiated.');
            // Reload order
            const { data } = await supabase.from('orders').select('status').eq('id', orderId).single();
            if (data) setOrder((prev: any) => ({ ...prev, status: (data as any).status }));

        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background pt-24 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-background pt-24 text-center">
            <h2 className="text-xl font-display font-bold">MISSION NOT FOUND</h2>
            <Button asChild className="mt-4"><Link to="/profile/orders">Return to Base</Link></Button>
        </div>
    );

    const isDelivered = order.status === 'delivered';
    const isShipped = order.status === 'shipped';
    const isCancelled = order.status === 'cancelled';
    const canCancel = ['pending', 'processing', 'pod_ready'].includes(order.status);

    // 7 Day Return Logic
    const deliveryDate = new Date(order.updated_at); // Assuming updated_at is delivery time if status is delivered
    const daysSinceDelivery = (new Date().getTime() - deliveryDate.getTime()) / (1000 * 3600 * 24);
    const canReturn = isDelivered && daysSinceDelivery <= 7;

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-4xl">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link to="/profile/orders" className="hover:text-primary transition-colors">Your Orders</Link>
                    <ChevronRight size={14} />
                    <span className="text-foreground font-bold">Order Details</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-display font-black italic uppercase tracking-wider">
                            Order Details
                        </h1>
                        <div className="text-sm text-muted-foreground mt-1 space-x-4">
                            <span>Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="text-foreground font-mono">#{order.order_number}</span>
                        </div>
                    </div>
                    {/* Invoice Button Placeholder */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10 uppercase tracking-widest text-xs font-bold">
                            Invoice
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Left Col: Order Info */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Status Banner */}
                        <div className={cn("border-l-4 p-4 rounded-r-lg bg-card border-y border-r border-white/5", getStatusColor(order.status))}>
                            <h3 className="font-bold uppercase tracking-wider text-lg flex items-center gap-2">
                                {order.status.replace('_', ' ')}
                            </h3>
                            {isShipped && (
                                <p className="text-sm mt-1 opacity-80">
                                    Your gear is on the move. Track it below.
                                </p>
                            )}
                            {isCancelled && <p className="text-sm mt-1 opacity-80">This mission was aborted.</p>}
                        </div>

                        {/* Items List */}
                        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-white/2">
                                <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Package size={16} className="text-primary" /> Mission Equipment
                                </h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {order.order_items.map((item: any) => (
                                    <div key={item.id} className="p-4 flex gap-4">
                                        <div className="w-20 h-20 bg-white/5 rounded-lg border border-white/5 flex-shrink-0">
                                            <img src={item.product?.images?.[0]} alt={item.product?.name} className="w-full h-full object-cover rounded-lg" />
                                        </div>
                                        <div className="flex-1">
                                            <Link to={`/product/${item.product?.id}`} className="font-bold text-foreground hover:text-primary transition-colors line-clamp-2">
                                                {item.product?.name}
                                            </Link>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Size: {item.size} | Qty: {item.quantity}
                                            </div>
                                            <div className="mt-2 font-mono font-bold flex items-center gap-2">
                                                {/* Price Logic: Show original if discount exists */}
                                                {(item.product?.base_price && item.product.base_price > item.price) && (
                                                    <span className="text-muted-foreground line-through text-xs">
                                                        {formatPrice(item.product.base_price)}
                                                    </span>
                                                )}
                                                <span className="text-primary">{formatPrice(item.price)}</span>

                                                {(item.product?.base_price && item.product.base_price > item.price) && (
                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
                                                        -{Math.round(((item.product.base_price - item.price) / item.product.base_price) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center">
                                            {/* Review Button if delivered */}
                                            {isDelivered && (
                                                <Button size="sm" variant="outline" className="text-xs h-8">
                                                    Write Review
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-card border border-white/5 rounded-xl p-6">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                <MapPin size={16} className="text-primary" /> Drop Zone
                            </h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p className="font-bold text-foreground">{order.shipping_address?.full_name}</p>
                                <p>{order.shipping_address?.address_line1}</p>
                                {order.shipping_address?.address_line2 && <p>{order.shipping_address?.address_line2}</p>}
                                <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}</p>
                                <p className="mt-2 text-foreground font-mono">{order.shipping_address?.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Actions & Summary */}
                    <div className="space-y-6">

                        {/* Actions Card */}
                        <div className="bg-card border border-white/5 rounded-xl p-6 space-y-3">
                            {isShipped || isDelivered ? (
                                <Button className="w-full font-bold tracking-widest bg-yellow-500 hover:bg-yellow-600 text-black">
                                    TRACK PACKAGE
                                </Button>
                            ) : null}

                            {canCancel && (
                                <Button
                                    variant="outline"
                                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                >
                                    {cancelling ? 'ABORTING...' : 'CANCEL ITEMS'}
                                </Button>
                            )}

                            {isShipped && !isDelivered && (
                                <Button disabled variant="secondary" className="w-full opacity-50 cursor-not-allowed">
                                    CANCEL ITEMS (DISPATCHED)
                                </Button>
                            )}

                            {canReturn && (
                                <Button variant="outline" className="w-full">
                                    RETURN / REPLACE
                                </Button>
                            )}

                            <Link to="/contact">
                                <Button variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-primary">
                                    <AlertCircle size={14} className="mr-2" />
                                    Need Help?
                                </Button>
                            </Link>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-card border border-white/5 rounded-xl p-6">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-4">Order Summary</h3>
                            <div className="space-y-2 text-sm">
                                {(() => {
                                    // Calculate Totals for Display
                                    const itemsTotalPaid = order.total_amount - order.shipping_cost;
                                    const itemsOriginalPrice = order.order_items.reduce((acc: any, item: any) => {
                                        return acc + ((item.product?.base_price || item.price) * item.quantity);
                                    }, 0);
                                    const totalSavings = itemsOriginalPrice - itemsTotalPaid;

                                    return (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Item(s) Subtotal:</span>
                                                <span className="text-foreground">{formatPrice(itemsOriginalPrice)}</span>
                                            </div>

                                            {totalSavings > 0 && (
                                                <div className="flex justify-between text-green-400">
                                                    <span>Savings:</span>
                                                    <span>-{formatPrice(totalSavings)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Shipping:</span>
                                                <span>{order.shipping_cost === 0 ? 'FREE' : formatPrice(order.shipping_cost)}</span>
                                            </div>

                                            <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-bold text-lg">
                                                <span>Grand Total:</span>
                                                <span className="text-primary">{formatPrice(order.total_amount)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                                <div className="text-xs text-muted-foreground mt-2">
                                    To: {order.shipping_address?.full_name}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-card border border-white/5 rounded-xl p-6">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Payment Method</h3>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="uppercase font-bold text-primary">
                                    {order.payment_status === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                                </span>
                                {order.payment_status === 'paid' && <span className="text-green-500 text-xs">(Verified)</span>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
