import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Package, MapPin, CreditCard, ChevronRight, Loader2, Copy } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/utils/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function OrderSuccessPage() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch basic order details + items
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            *,
                            product:products (name, images)
                        )
                    `)
                    .eq('id', orderId)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (error) {
                console.error("Error details:", error);
                // Don't show error to user immediately, just loading state check
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();

        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, [orderId]);

    const copyOrderId = () => {
        if (order?.order_number) {
            navigator.clipboard.writeText(order.order_number);
            toast.success("Order ID copied to clipboard");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    // Safety fallback if order load failed but likely id exists
    const displayId = order?.order_number || order?.id || orderId;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 py-12 px-4 flex justify-center">
                <div className="w-full max-w-4xl space-y-8">

                    {/* Header Status */}
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                                <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-black uppercase italic neon-text tracking-tighter">
                            Mission Confirmed!
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Excellently executed, Legend. Your loot has been secured and is being prepared for extraction.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        {/* LEFT: Order Details */}
                        <div className="md:col-span-2 space-y-6">

                            {/* Order Info Card */}
                            <div className="bg-card/50 border border-white/10 rounded-xl overflow-hidden">
                                <div className="bg-white/5 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-primary" />
                                        <span className="font-bold tracking-widest text-sm uppercase">Order Manifest</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-white/10">
                                        <span className="text-xs font-mono text-muted-foreground">ID:</span>
                                        <span className="text-xs font-mono font-bold text-primary">{displayId}</span>
                                        <button onClick={copyOrderId} className="text-muted-foreground hover:text-white transition-colors">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 divide-y divide-white/5">
                                    {order?.order_items?.map((item: any, idx: number) => (
                                        <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                                            <div className="w-20 h-20 bg-white/5 rounded-lg border border-white/5 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.product?.images?.[0]}
                                                    alt={item.product?.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h3 className="font-bold text-lg leading-tight mb-1">{item.product?.name}</h3>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    {item.product_snapshot?.variant?.size && (
                                                        <span className="bg-white/5 px-2 py-0.5 rounded textxs font-bold border border-white/5 uppercase">
                                                            Size: {item.product_snapshot.variant.size}
                                                        </span>
                                                    )}
                                                    <span>Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col justify-center">
                                                <span className="font-display font-bold text-lg text-primary">
                                                    {formatPrice(item.price_at_purchase * item.quantity)}
                                                </span>
                                                {item.quantity > 1 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatPrice(item.price_at_purchase)} / ea
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping & Payment Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Shipping Address */}
                                <div className="bg-card/50 border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Drop Zone</span>
                                    </div>
                                    {order?.shipping_address ? (
                                        <div className="space-y-1 text-sm">
                                            <p className="font-bold text-lg text-foreground mb-2">{order.shipping_address.full_name}</p>
                                            <p>{order.shipping_address.address_line1}</p>
                                            {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                                            <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}</p>
                                            <p className="mt-2 text-muted-foreground">{order.shipping_address.phone}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Digital Delivery</p>
                                    )}
                                </div>

                                {/* Payment Info */}
                                <div className="bg-card/50 border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <CreditCard className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Payment Intel</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Method</span>
                                            <span className="font-bold uppercase">{order?.payment_provider || "Prepaid"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Status</span>
                                            <span className="text-green-500 font-bold uppercase text-xs border border-green-500/20 bg-green-500/10 px-2 py-0.5 rounded-sm">
                                                {order?.payment_status}
                                            </span>
                                        </div>
                                        {/* Divider */}
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="font-bold text-sm">Total Paid</span>
                                            <span className="font-display font-black text-xl text-primary">
                                                {order ? formatPrice(order.total_amount) : "..."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Actions */}
                        <div className="space-y-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    A confirmation email with the invoice has been sent to your registered comlink.
                                </p>
                                <Button className="w-full font-bold tracking-widest" variant="outline">
                                    DOWNLOAD INVOICE
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <Link to="/profile/orders">
                                    <Button className="w-full h-12 font-display italic tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 text-lg group">
                                        TRACK MISSION
                                        <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link to="/shop">
                                    <Button variant="ghost" className="w-full font-bold text-muted-foreground hover:text-white">
                                        CONTINUE SHOPPING
                                    </Button>
                                </Link>
                            </div>

                            {/* Help Box */}
                            <div className="bg-card border border-white/5 rounded-xl p-4 flex items-start gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                <div>
                                    <p className="text-xs font-bold text-foreground mb-1">NEED SUPPORT?</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        If you have any issues with this deployment, contact command immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
