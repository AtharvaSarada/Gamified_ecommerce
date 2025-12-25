import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { items, removeItem, updateQuantity, cartTotal, cartCount } = useCart();

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
                        className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%", skewX: 5 }}
                        animate={{ x: 0, skewX: 0 }}
                        exit={{ x: "100%", skewX: -5 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l-2 border-primary/30 z-[101] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* HUD Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                        {/* Header */}
                        <div className="p-6 border-b border-primary/20 flex items-center justify-between relative bg-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded">
                                    <ShoppingBag className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-xl tracking-tighter uppercase italic">
                                        Loadout <span className="text-primary">[{cartCount}]</span>
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                                        Mission Ready Equipment
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/20 text-primary">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="w-20 h-20 mb-4 border-2 border-dashed border-primary/30 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="w-10 h-10" />
                                    </div>
                                    <p className="font-display font-medium uppercase tracking-widest text-sm">
                                        No Gear Equipped
                                    </p>
                                    <p className="text-xs mt-2 uppercase">Loot some items to fill your loadout</p>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <motion.div
                                        key={`${item.id}-${idx}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex gap-4 group"
                                    >
                                        <div className="w-24 h-24 bg-muted/30 border border-primary/20 angular-card overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-display font-bold text-sm tracking-wide uppercase truncate max-w-[180px]">
                                                        {item.name}
                                                    </h3>
                                                    <span className="text-primary font-display font-bold text-sm">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                                    Size: <span className="text-foreground">{item.size}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center border border-primary/20 bg-background/50 rounded overflow-hidden">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:bg-primary/20 text-primary"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-display font-bold tabular-nums">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-primary/20 text-primary"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-primary/5 border-t border-primary/20 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{formatPrice(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-display font-black tracking-tighter uppercase italic">
                                    <span>Total Requirement</span>
                                    <span className="text-primary neon-text tabular-nums">{formatPrice(cartTotal)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black italic text-lg tracking-widest py-6 angular-btn group"
                                disabled={items.length === 0}
                            >
                                PROCEED TO CHECKOUT
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <p className="text-[8px] text-center text-muted-foreground uppercase tracking-[0.2em]">
                                Secure Transmission Enabled // GG-G-ENCRYPT-v4.2
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
