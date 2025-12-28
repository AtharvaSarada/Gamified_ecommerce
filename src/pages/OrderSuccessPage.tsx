import React, { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";

export function OrderSuccessPage() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                <div className="text-center space-y-6 max-w-lg mx-auto">
                    <div className="flex justify-center mb-6">
                        <CheckCircle2 className="w-24 h-24 text-green-500 animate-pulse" />
                    </div>

                    <h1 className="text-4xl font-display font-black uppercase italic neon-text">
                        Order Confirmed!
                    </h1>

                    <p className="text-muted-foreground text-lg">
                        Thank you for your purchase, Legend! Your loot is being prepared and will be shipped soon.
                    </p>

                    {orderId && (
                        <div className="bg-card border border-border p-4 rounded-md font-mono text-sm">
                            Order ID: <span className="text-primary font-bold">{orderId}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Link to="/shop">
                            <Button variant="outline" className="w-full sm:w-auto font-display italic tracking-wider">
                                <ShoppingBag className="mr-2 w-4 h-4" />
                                CONTINUE SHOPPING
                            </Button>
                        </Link>
                        <Link to="/profile/orders">
                            <Button className="w-full sm:w-auto font-display italic tracking-wider bg-primary text-primary-foreground">
                                VIEW MY ORDERS
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
