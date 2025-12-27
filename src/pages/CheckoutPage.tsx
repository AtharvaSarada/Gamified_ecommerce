import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/utils/pricing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CheckoutPage() {
    const { items, cartTotal, cartSavings } = useCart();
    const shippingCost = 0; // Free shipping for now based on prompt examples
    const finalTotal = cartTotal + shippingCost;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl font-display font-black uppercase italic neon-text mb-8">
                        Checkout
                    </h1>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Left Column: Form (Placeholder for now) */}
                        <div className="space-y-6">
                            <div className="bg-card border-2 border-primary/20 p-6 angular-card">
                                <h2 className="font-display font-bold text-lg mb-4 uppercase tracking-widest">
                                    Shipping Information
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Checkout form would go here.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="space-y-6">
                            <div className="bg-card border-2 border-primary/20 p-6 angular-card">
                                <h2 className="font-display font-bold text-lg mb-6 uppercase tracking-widest">
                                    Order Summary
                                </h2>

                                {/* Items */}
                                <div className="space-y-4 mb-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start text-sm">
                                            <div className="flex-1 mr-4">
                                                <span className="font-medium">{item.name}</span>
                                                <div className="text-xs text-muted-foreground">
                                                    Size: {item.size} | Qty: {item.quantity}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-primary">
                                                    {formatPrice(item.finalPrice * item.quantity)}
                                                </div>
                                                {item.discountPercentage > 0 && (
                                                    <div className="text-xs text-muted-foreground line-through">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border my-4 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase tracking-wider">Subtotal</span>
                                        <span>{formatPrice(cartTotal)}</span>
                                    </div>

                                    {cartSavings > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span className="uppercase tracking-wider">Discount</span>
                                            <span>-{formatPrice(cartSavings)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase tracking-wider">Shipping</span>
                                        <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 mt-4">
                                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded border border-primary/10">
                                        <span className="text-xl font-bold font-display uppercase italic">Total</span>
                                        <span className="text-2xl font-bold text-cyan-400 font-display italic">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                </div>

                                <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black italic text-lg tracking-widest py-6 angular-btn group">
                                    CONFIRM ORDER
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
