import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, ArrowRight, Info, AlertCircle, ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatPrice } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { items, removeItem, updateQuantity, updateItemSize, cartTotal, cartCount, isLoading } = useCart();
    const navigate = useNavigate();
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    // Filter out duplicates if any (though logic should prevent them)
    // and sort by name for consistent view
    const displayItems = items;

    // Calculate actual total with discounts (handled in Context usually, but double checking visual logic)
    // The Context's cartTotal already includes discounts based on my previous implementation.

    // Disable checkout if any item is out of stock (quantity > maxStock)
    const hasStockIssues = items.some(item => item.quantity > item.maxStock);
    const canCheckout = items.length > 0 && !hasStockIssues && !isLoading;

    // Handle checkout navigation
    const handleCheckout = () => {
        if (!canCheckout) return;
        onClose();
        navigate("/checkout");
    };

    // Helper for optimistic visual loading
    const handleQuantityChange = async (itemId: string, newQty: number) => {
        setUpdatingItemId(itemId);
        await updateQuantity(itemId, newQty);
        setUpdatingItemId(null);
    };

    const handleSizeChange = async (itemId: string, newSize: string) => {
        setUpdatingItemId(itemId);
        await updateItemSize(itemId, newSize);
        setUpdatingItemId(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[480px] bg-background border-l border-border z-[101] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-lg tracking-tight uppercase">
                                        Your Loadout
                                    </h2>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {cartCount} {cartCount === 1 ? 'Item' : 'Items'} Equipped
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 custom-scrollbar">
                            {isLoading && items.length === 0 ? (
                                // Loading Skeleton
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 animate-pulse">
                                            <div className="w-24 h-24 bg-muted rounded-md" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-muted w-3/4 rounded" />
                                                <div className="h-3 bg-muted w-1/2 rounded" />
                                                <div className="h-8 bg-muted w-full mt-2 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : items.length === 0 ? (
                                // Empty State
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-2">
                                        <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-medium text-lg">Inventory Empty</h3>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-[200px] mx-auto">
                                            Your equipment list is currently empty.
                                        </p>
                                    </div>
                                    <Button onClick={onClose} variant="outline" className="mt-4">
                                        Browse Gear
                                    </Button>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const isUpdating = updatingItemId === item.id;
                                    const discountedPrice = item.price * (1 - item.discount_percentage / 100);

                                    return (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className={cn(
                                                "group relative flex gap-4 p-4 bg-card border border-border rounded-lg transition-all hover:border-primary/20",
                                                isUpdating && "opacity-60 pointer-events-none"
                                            )}
                                        >
                                            {/* Image */}
                                            <div className="w-24 h-24 bg-muted rounded-md overflow-hidden shrink-0 border border-border/50">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                        <ShoppingBag className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-display font-bold text-sm uppercase truncate pr-4">
                                                            {item.name}
                                                        </h3>
                                                        <div className="text-right shrink-0">
                                                            <div className="font-display font-bold text-sm text-primary">
                                                                {formatPrice(discountedPrice * item.quantity)}
                                                            </div>
                                                            {item.discount_percentage > 0 && (
                                                                <div className="text-[10px] text-muted-foreground line-through">
                                                                    {formatPrice(item.price * item.quantity)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Warning for Stock Issues */}
                                                    {item.quantity > item.maxStock && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-destructive mt-1 font-medium">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Only {item.maxStock} left in stock
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-end justify-between gap-3 mt-3">

                                                    {/* Controls Grid */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Size Selector */}
                                                        {item.productVariants && item.productVariants.length > 0 && (
                                                            <Select
                                                                value={item.size}
                                                                onValueChange={(val) => handleSizeChange(item.id, val)}
                                                                disabled={isUpdating}
                                                            >
                                                                <SelectTrigger className="h-8 w-[70px] text-xs font-bold uppercase">
                                                                    <SelectValue placeholder="Size" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {item.productVariants.map((v) => (
                                                                        <SelectItem
                                                                            key={v.id}
                                                                            value={v.size}
                                                                            disabled={v.stock_quantity === 0}
                                                                            className="text-xs"
                                                                        >
                                                                            {v.size} {v.stock_quantity === 0 ? '(OOS)' : ''}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}

                                                        {/* Quantity Selector */}
                                                        {item.maxStock <= 10 ? (
                                                            <Select
                                                                value={item.quantity.toString()}
                                                                onValueChange={(val) => handleQuantityChange(item.id, parseInt(val))}
                                                                disabled={isUpdating}
                                                            >
                                                                <SelectTrigger className="h-8 w-[60px] text-xs font-bold tabular-nums">
                                                                    <SelectValue placeholder="Qty" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Array.from({ length: Math.min(10, item.maxStock) }).map((_, i) => (
                                                                        <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs">
                                                                            {i + 1}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="flex items-center h-8 bg-card border border-input rounded-md max-w-[90px]">
                                                                <button
                                                                    className="px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                                    disabled={item.quantity <= 1 || isUpdating}
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    className="w-full text-center bg-transparent text-xs font-bold tabular-nums focus:outline-none appearance-none"
                                                                    value={item.quantity}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value);
                                                                        if (val > 0) handleQuantityChange(item.id, val);
                                                                    }}
                                                                    min={1}
                                                                    max={item.maxStock}
                                                                    disabled={isUpdating}
                                                                />
                                                                <button
                                                                    className="px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                                    disabled={item.quantity >= item.maxStock || isUpdating}
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Remove Button */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => removeItem(item.id)}
                                                                    className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-md"
                                                                    disabled={isUpdating}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Remove Item</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex-none p-6 bg-background/95 border-t border-border space-y-4 backdrop-blur-md z-10 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.5)]">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    {/* Show Original Price sum here */}
                                    <span className="tabular-nums font-mono">
                                        {formatPrice(items.reduce((acc, item) => acc + item.price * item.quantity, 0))}
                                    </span>
                                </div>

                                {items.some(item => item.discount_percentage > 0) && (
                                    <div className="flex justify-between text-xs text-green-500 uppercase tracking-widest font-bold">
                                        <span>Discount</span>
                                        <span className="tabular-nums font-mono">
                                            - {formatPrice(items.reduce((acc, item) => acc + (item.price * (item.discount_percentage / 100) * item.quantity), 0))}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-xl font-display font-black tracking-tighter uppercase italic pt-2 border-t border-border/50">
                                    <span>Total</span>
                                    <span className="text-primary neon-text tabular-nums">{formatPrice(cartTotal)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black italic text-lg tracking-widest py-6 angular-btn group"
                                disabled={!canCheckout}
                                onClick={handleCheckout}
                            >
                                PROCEED TO CHECKOUT
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
                                Secure Transmission // ENCRYPTED
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
