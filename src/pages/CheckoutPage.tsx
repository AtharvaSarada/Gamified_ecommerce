import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/utils/pricing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, CreditCard, Truck, MapPin } from "lucide-react";
import { ShippingForm, ShippingFormData } from "@/components/checkout/ShippingForm";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');
    const [shippingCost, setShippingCost] = useState(0);
    const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
    const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Address Book Logic
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
    const [formDefaultValues, setFormDefaultValues] = useState<Partial<ShippingFormData>>({});

    // Fetch Saved Addresses
    useEffect(() => {
        if (user) {
            const fetchAddresses = async () => {
                const { data, error } = await supabase
                    .from('shipping_addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false });

                if (data && data.length > 0) {
                    setSavedAddresses(data);
                    // Automatically select default address
                    const defaultAddr = data.find((a: any) => a.is_default) || data[0];
                    setSelectedAddressId(defaultAddr.id);
                    setFormDefaultValues({
                        fullName: defaultAddr.full_name,
                        phone: defaultAddr.phone,
                        addressLine1: defaultAddr.address_line1,
                        addressLine2: defaultAddr.address_line2 || "",
                        city: defaultAddr.city,
                        state: defaultAddr.state,
                        pinCode: defaultAddr.postal_code,
                        email: user.email || ""
                    });
                    // Trigger serviceability check for default address
                    handlePinCodeChange(defaultAddr.postal_code);
                }
            };
            fetchAddresses();
        }
    }, [user]);

    // Handle Address Selection Change
    const handleAddressChange = (value: string) => {
        setSelectedAddressId(value);
        if (value === 'new') {
            setFormDefaultValues({
                fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: undefined, pinCode: "", email: user?.email || ""
            });
            setIsServiceable(null);
        } else {
            const addr = savedAddresses.find(a => a.id === value);
            if (addr) {
                setFormDefaultValues({
                    fullName: addr.full_name,
                    phone: addr.phone,
                    addressLine1: addr.address_line1,
                    addressLine2: addr.address_line2 || "",
                    city: addr.city,
                    state: addr.state,
                    pinCode: addr.postal_code,
                    email: user?.email || ""
                });
                // Check serviceability for selected address
                handlePinCodeChange(addr.postal_code);
            }
        }
    };

    // Business Logic: Free Shipping Calculation
    useEffect(() => {
        const calculateShipping = async () => {
            if (paymentMethod === 'prepaid') {
                setShippingCost(0);
                return;
            }
            if (cartTotal >= 1000) {
                setShippingCost(0);
                return;
            }
            if (isServiceable !== false) {
                setShippingCost(49);
            }
        };
        calculateShipping();
    }, [paymentMethod, cartTotal, isServiceable]);

    // Serviceability Check
    const handlePinCodeChange = useCallback(async (pinCode: string) => {
        setIsCheckingServiceability(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            // In Production: check serviceability API
            setIsServiceable(true);
            toast.success("Delivery available to this PIN", { id: 'pincode-check' });
        } catch (error) {
            setIsServiceable(false);
            toast.error("Serviceability check failed");
        } finally {
            setIsCheckingServiceability(false);
        }
    }, []);

    const handleFormSubmit = async (data: ShippingFormData) => {
        setShippingData(data);
        handlePlaceOrder(data);
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (document.getElementById('razorpay-checkout-js')) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.id = 'razorpay-checkout-js';
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePlaceOrder = async (formData: ShippingFormData) => {
        if (items.length === 0) {
            toast.error("Your cart is empty!");
            return;
        }

        if (!isServiceable && paymentMethod === 'cod') {
            toast.error("Please verify PIN code serviceability first");
            return;
        }

        setIsProcessing(true);

        // Helper: Save Address if requested
        const saveAddressIfNeeded = async () => {
            if (formData.saveAddress && user) {
                try {
                    await supabase.from('shipping_addresses').insert({
                        user_id: user.id,
                        full_name: formData.fullName,
                        phone: formData.phone,
                        address_line1: formData.addressLine1,
                        address_line2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.pinCode,
                        country: 'IN',
                        is_default: savedAddresses.length === 0 // Make default if first address
                    });
                    // We don't block order placement if autosave fails, just log it
                    console.log("Address saved to deployment zones");
                } catch (e) {
                    console.error("Failed to save address", e);
                }
            }
        };

        try {
            await saveAddressIfNeeded();

            // 1. Load Razorpay Script FIRST if prepaid
            if (paymentMethod === 'prepaid') {
                const isLoaded = await loadRazorpayScript();
                if (!isLoaded) {
                    throw new Error("Razorpay SDK failed to load. Check your internet connection.");
                }
            }

            // 2. Prepare Payload
            const payload = {
                cart_items: items.map(item => ({
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    price: item.price
                })),
                shipping_address_id: selectedAddressId !== 'new' ? selectedAddressId : null,
                payment_provider: paymentMethod === 'prepaid' ? 'razorpay' : 'cod',
                guest_info: {
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        fullName: formData.fullName,
                        addressLine1: formData.addressLine1,
                        addressLine2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        pinCode: formData.pinCode,
                        country: 'IN'
                    }
                },
                shipping_cost: shippingCost
            };

            // 3. Call Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('create-order', {
                body: payload
            });

            if (error) {
                console.error("Function Error Details:", { message: error.message, context: error.context });
                let errorDetails = error.message;
                try {
                    const parsed = JSON.parse(error.message);
                    if (parsed && parsed.error) errorDetails = `${parsed.error} ${parsed.details || ''}`;
                } catch (e) {
                    // ignore
                }
                throw new Error(errorDetails || "Failed to create order");
            }

            console.log("Order Created:", data);

            if (paymentMethod === 'prepaid') {
                // 4. Open Razorpay (Manual Implementation)
                const options = {
                    key: data.key,
                    amount: data.amount,
                    currency: data.currency,
                    name: "Loot Drop",
                    description: "Gaming Gear Order",
                    order_id: data.razorpay_order_id,
                    handler: async function (response: any) {
                        toast.success("Payment Successful!");
                        clearCart();
                        navigate(`/order-success?orderId=${data.order_id}`);
                    },
                    prefill: {
                        name: formData.fullName,
                        email: formData.email,
                        contact: formData.phone,
                    },
                    theme: {
                        color: "#00E5FF",
                    },
                    modal: {
                        ondismiss: function () {
                            setIsProcessing(false);
                            toast.info("Payment Cancelled");
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    console.error("Payment Failed", response.error);
                    toast.error(`Payment Failed: ${response.error.description}`);
                    setIsProcessing(false);
                });
                rzp.open();

            } else {
                // COD Success
                toast.success("Order Placed Successfully!");
                clearCart();
                navigate(`/order-success?orderId=${data.order_id}`);
            }

        } catch (error: any) {
            console.error("Checkout Error:", error);
            toast.error(error.message || "Failed to place order. Please try again.");
            setIsProcessing(false);
        }
    };

    // Derived Totals
    const finalTotal = cartTotal + shippingCost;
    const originalSubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalSavings = items.reduce((acc, item) => acc + (item.price * (item.discount_percentage / 100) * item.quantity), 0);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h1 className="text-4xl font-display font-black uppercase italic neon-text mb-8">
                        Checkout
                    </h1>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Left Column: Forms */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Shipping Address */}
                            <div className="bg-card border-2 border-primary/20 p-6 angular-card">
                                <h2 className="font-display font-bold text-xl mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <Truck className="w-6 h-6 text-primary" />
                                    Shipping Details
                                </h2>

                                {/* Address Book Selection */}
                                {savedAddresses.length > 0 && (
                                    <div className="mb-6">
                                        <Label className="mb-2 block text-muted-foreground uppercase text-xs tracking-wider">Load from Deployment Zones</Label>
                                        <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a saved address" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">
                                                    <div className="flex items-center gap-2 font-bold text-primary">
                                                        <MapPin size={14} /> Enter New Address
                                                    </div>
                                                </SelectItem>
                                                {savedAddresses.map((addr) => (
                                                    <SelectItem key={addr.id} value={addr.id}>
                                                        <span className="font-medium">{addr.full_name}</span> - {addr.city}, {addr.postal_code}
                                                        {addr.is_default && <span className="ml-2 text-xs text-primary bg-primary/10 px-1 rounded">DEFAULT</span>}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <ShippingForm
                                    onSubmit={handleFormSubmit}
                                    onPinCodeChange={handlePinCodeChange}
                                    isServiceable={isServiceable}
                                    isLoading={isCheckingServiceability}
                                    defaultValues={formDefaultValues}
                                    mode="checkout"
                                />
                            </div>

                            {/* Payment Method */}
                            <div className="bg-card border-2 border-primary/20 p-6 angular-card">
                                <h2 className="font-display font-bold text-xl mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                    Payment Method
                                </h2>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(val) => setPaymentMethod(val as 'prepaid' | 'cod')}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {/* Prepaid - Razorpay */}
                                    <div>
                                        <RadioGroupItem value="prepaid" id="prepaid" className="peer sr-only" />
                                        <Label
                                            htmlFor="prepaid"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                        >
                                            <span className="text-lg font-bold uppercase italic">Pay Now</span>
                                            <span className="text-sm text-muted-foreground mt-1">UPI, Cards, NetBanking</span>
                                            <span className="text-xs text-green-500 font-bold mt-2">FREE Shipping</span>
                                        </Label>
                                    </div>

                                    {/* COD */}
                                    <div>
                                        <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                                        <Label
                                            htmlFor="cod"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                        >
                                            <span className="text-lg font-bold uppercase italic">Cash on Delivery</span>
                                            <span className="text-sm text-muted-foreground mt-1">Pay at doorstep</span>
                                            {cartTotal < 1000 && <span className="text-xs text-orange-500 font-bold mt-2">+ Shipping Charges</span>}
                                            {cartTotal >= 1000 && <span className="text-xs text-green-500 font-bold mt-2">FREE Shipping</span>}
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="space-y-6">
                            <div className="bg-card border-2 border-primary/20 p-6 angular-card sticky top-24">
                                <h2 className="font-display font-bold text-lg mb-6 uppercase tracking-widest">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                    {items.map((item) => {
                                        const discountedPrice = item.price * (1 - (item.discount_percentage || 0) / 100);
                                        return (
                                            <div key={item.id} className="flex justify-between items-start text-sm">
                                                <div className="flex-1 mr-4">
                                                    <span className="font-medium">{item.name}</span>
                                                    <div className="text-xs text-muted-foreground">
                                                        Size: {item.size} | Qty: {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-primary">
                                                        {formatPrice(discountedPrice * item.quantity)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-border my-4 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase tracking-wider">Subtotal</span>
                                        <span>{formatPrice(originalSubtotal)}</span>
                                    </div>

                                    {totalSavings > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span className="uppercase tracking-wider">Discount</span>
                                            <span>-{formatPrice(totalSavings)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground uppercase tracking-wider">Shipping</span>
                                        <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
                                    </div>

                                    {paymentMethod === 'cod' && shippingCost > 0 && (
                                        <div className="text-xs text-muted-foreground text-right italic">
                                            (Free on orders above ₹1000 or prepaid)
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-border pt-4 mt-4">
                                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded border border-primary/10">
                                        <span className="text-xl font-bold font-display uppercase italic">Total</span>
                                        <span className="text-2xl font-bold text-cyan-400 font-display italic">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black italic text-lg tracking-widest py-8 angular-btn group"
                                    disabled={isProcessing || (paymentMethod === 'cod' && !isServiceable)}
                                    onClick={() => document.getElementById('shipping-form-submit')?.click()}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="animate-spin w-6 h-6" />
                                    ) : (
                                        <>
                                            {paymentMethod === 'prepaid' ? 'PAY NOW' : 'PLACE ORDER'}
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
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
