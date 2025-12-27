import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { ProductVariant } from "@/types";

export interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    productVariants: ProductVariant[];
    maxStock: number;
    discount_percentage: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "id" | "productVariants" | "maxStock" | "discount_percentage">) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    updateItemSize: (itemId: string, newSize: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    cartTotal: number;
    cartCount: number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const loadCart = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        if (user) {
            // Fetch from Supabase
            const { data: cartData, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (cartData && !cartError) {
                const { data: itemsData, error: itemsError } = await supabase
                    .from("cart_items")
                    .select(`
                        id,
                        product_id,
                        variant_id,
                        quantity,
                        products (
                            name, 
                            base_price, 
                            images, 
                            discount_percentage,
                            product_variants (
                                id,
                                size,
                                stock_quantity,
                                sku
                            )
                        ),
                        product_variants (size, stock_quantity)
                    `)
                    .eq("cart_id", (cartData as any).id);

                if (itemsData && !itemsError) {
                    const formattedItems: CartItem[] = (itemsData as any[]).map((item: any) => {
                        // Find the specific variant to get accurate maxStock for the current size
                        // Note: We also have item.product_variants joined, but let's assume we want the list of ALL variants for the dropdown
                        // The join `products (..., product_variants (...))` gives us all variants for the product.

                        const currentVariant = item.products.product_variants.find((v: any) => v.id === item.variant_id);

                        return {
                            id: item.id,
                            productId: item.product_id,
                            variantId: item.variant_id,
                            name: item.products.name,
                            price: item.products.base_price,
                            image: item.products.images?.[0] || "",
                            size: currentVariant?.size || "N/A",
                            quantity: item.quantity,
                            productVariants: item.products.product_variants,
                            maxStock: currentVariant?.stock_quantity || 0,
                            discount_percentage: item.products.discount_percentage || 0,
                        };
                    });

                    // Check for OOS items during refresh
                    formattedItems.forEach(item => {
                        if (item.maxStock === 0) {
                            toast.warning(`${item.name} (${item.size}) is now out of stock`);
                        }
                    });

                    setItems(formattedItems);
                }
            }
        } else {
            // Load from local storage for guests
            const savedCart = localStorage.getItem("gg_cart");
            if (savedCart) {
                try {
                    setItems(JSON.parse(savedCart));
                } catch (e) {
                    console.error("Failed to parse cart", e);
                }
            }
        }
        if (showLoading) setIsLoading(false);
    }, [user]);

    // Initial load
    useEffect(() => {
        loadCart();
    }, [loadCart]);

    // Persist guest cart
    useEffect(() => {
        if (!user) {
            localStorage.setItem("gg_cart", JSON.stringify(items));
        }
    }, [items, user]);

    // Refetch on window focus
    useEffect(() => {
        const handleFocus = () => loadCart(false);
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [loadCart]);

    const refreshCart = async () => {
        await loadCart(false);
    };

    const addItem = async (newItem: Omit<CartItem, "id" | "productVariants" | "maxStock" | "discount_percentage">) => {
        // Note: For full implementation, we should fetch variants/stock here too, 
        // but often the product page passes enough info or we'll refresh after adding.
        // For now, let's keep basic add logic but trigger a refresh to get full variant data.

        if (user) {
            try {
                // Get or create cart
                let { data: cart } = await supabase
                    .from("carts")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (!cart) {
                    const { data: newCart, error } = await supabase
                        .from("carts")
                        .insert({ user_id: user.id } as any)
                        .select()
                        .single();
                    if (error) throw error;
                    cart = newCart;
                }

                if (!cart) throw new Error("Could not initialize cart");

                // Check if item already exists
                const existingItem = items.find(
                    (i) => i.productId === newItem.productId && i.size === newItem.size
                );

                if (existingItem) {
                    const { error } = await supabase
                        .from("cart_items")
                        .update({ quantity: existingItem.quantity + newItem.quantity } as any)
                        .eq("id", existingItem.id);
                    if (error) throw error;

                    toast.success("Added to equipment");
                    await refreshCart(); // Refresh to get updated stock/variants
                } else {
                    const { data: insertedItem, error } = await supabase
                        .from("cart_items")
                        .insert({
                            cart_id: (cart as any).id,
                            product_id: newItem.productId,
                            variant_id: newItem.variantId,
                            quantity: newItem.quantity,
                        } as any)
                        .select()
                        .single();

                    if (error || !insertedItem) throw error || new Error("Insert failed");

                    toast.success("Added to equipment");
                    await refreshCart();
                }
            } catch (error) {
                console.error("Cart Add Error:", error);
                toast.error("Deployment failed: Could not add item");
            }
        } else {
            // Guest Logic
            const existingIdx = items.findIndex(
                (i) => i.productId === newItem.productId && i.size === newItem.size
            );
            if (existingIdx > -1) {
                const updated = [...items];
                updated[existingIdx].quantity += newItem.quantity;
                setItems(updated);
            } else {
                // For meaningful guest cart with variants, we would need to pass options in.
                // Assuming guest adds from PDP where we have data.
                // Simple version: just add what we have, won't have other variants to switch to until login or complex guest fetch.
                setItems(prev => [...prev, {
                    ...newItem,
                    id: Math.random().toString(36).substr(2, 9),
                    productVariants: [],
                    maxStock: 99, // Unknown for guest without fetch
                    discount_percentage: 0
                }]);
            }
            toast.success("Added to backpack (Guest mode)");
        }
    };

    const removeItem = async (itemId: string) => {
        const previousItems = [...items];
        const itemToRemove = items.find(i => i.id === itemId);

        // Optimistic Update
        setItems(prev => prev.filter(i => i.id !== itemId));

        if (user) {
            try {
                const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
                if (error) throw error;
            } catch (error) {
                // Rollback
                setItems(previousItems);
                toast.error("Could not drop item");
                return;
            }
        }

        toast.info("Item dropped", {
            action: itemToRemove ? {
                label: "Undo",
                onClick: async () => {
                    if (user && itemToRemove) {
                        // Re-add to DB
                        // Note: this is complex because we need the original variant details.
                        // For simple Re-add, we call addItem again or manual insert.
                        // Let's rely on simple state restore for the visual part if it failed,
                        // but for a successful delete undo, we basically re-add.
                        // Implementing true Undo for DB delete requires re-inserting.
                        // For this specific 'Undo' requirement, let's keep it simple:
                        // We'll just call addItem (which might be slightly different flow) or insert directly.
                        // Ideally, we shouldn't have deleted it from DB yet if we want easy undo, OR we re-insert.
                        // Let's re-insert.

                        // Hack for now: Refresh cart to ensure consistency or re-add
                        // Since we don't have all DB fields easily for raw insert, we'll try addItem logic
                        addItem({
                            productId: itemToRemove.productId,
                            variantId: itemToRemove.variantId,
                            name: itemToRemove.name,
                            price: itemToRemove.price,
                            image: itemToRemove.image,
                            size: itemToRemove.size,
                            quantity: itemToRemove.quantity
                        });
                    } else {
                        setItems(previousItems);
                    }
                }
            } : undefined
        });
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (quantity < 1) return;

        const item = items.find(i => i.id === itemId);
        if (!item) return;

        if (quantity > item.maxStock) {
            toast.warning(`Only ${item.maxStock} units available`);
            // Optimistically set to max
            quantity = item.maxStock;
        }

        const previousItems = [...items];
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));

        if (user) {
            try {
                const { error } = await supabase
                    .from("cart_items")
                    .update({ quantity } as any)
                    .eq("id", itemId);
                if (error) throw error;
            } catch (error) {
                setItems(previousItems);
                toast.error("Calibration failed");
            }
        }
    };

    const updateItemSize = async (itemId: string, newSize: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const targetVariant = item.productVariants.find(v => v.size === newSize);
        if (!targetVariant) {
            toast.error("Size variant not found");
            return;
        }

        const previousItems = [...items];

        // Check merge scenario
        const existingMergeTarget = items.find(i => i.productId === item.productId && i.variantId === targetVariant.id && i.id !== itemId);

        if (existingMergeTarget && user) {
            // MERGE
            const newQuantity = existingMergeTarget.quantity + item.quantity;
            const finalQuantity = Math.min(newQuantity, targetVariant.stock_quantity);

            if (newQuantity > targetVariant.stock_quantity) {
                toast.warning(`Merged quantity capped at ${targetVariant.stock_quantity} (Max Stock)`);
            }

            // Optimistic Update: Remove old item, update target item
            setItems(prev => prev.filter(i => i.id !== itemId).map(i =>
                i.id === existingMergeTarget.id ? { ...i, quantity: finalQuantity } : i
            ));

            try {
                // Delete old
                const { error: deleteError } = await supabase.from("cart_items").delete().eq("id", itemId);
                if (deleteError) throw deleteError;

                // Update target
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ quantity: finalQuantity } as any)
                    .eq("id", existingMergeTarget.id);
                if (updateError) throw updateError;

                toast.success("Gear merged with existing stack");

            } catch (error) {
                console.error("Merge error", error);
                setItems(previousItems);
                toast.error("Could not switch size");
            }

        } else if (user) {
            // SIMPLE SWITCH
            // Check stock for current quantity
            let newQuantity = item.quantity;
            if (newQuantity > targetVariant.stock_quantity) {
                newQuantity = targetVariant.stock_quantity;
                toast.warning(`Quantity reduced to ${newQuantity} due to stock limits`);
            }

            // Optimistic Update
            setItems(prev => prev.map(i =>
                i.id === itemId ? {
                    ...i,
                    size: newSize,
                    variantId: targetVariant.id,
                    maxStock: targetVariant.stock_quantity,
                    quantity: newQuantity
                } : i
            ));

            try {
                const { error } = await supabase
                    .from("cart_items")
                    .update({
                        variant_id: targetVariant.id,
                        quantity: newQuantity
                    } as any)
                    .eq("id", itemId);

                if (error) throw error;
                toast.success("Size updated");
            } catch (error) {
                setItems(previousItems);
                toast.error("Could not switch size");
            }
        }
    };

    const clearCart = async () => {
        if (user) {
            const { data: cart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();
            if (cart) {
                await supabase.from("cart_items").delete().eq("cart_id", (cart as any).id);
            }
        }
        setItems([]);
    };

    const cartTotal = items.reduce((sum, item) => {
        const price = item.price * (1 - item.discount_percentage / 100);
        return sum + price * item.quantity;
    }, 0);

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                updateItemSize,
                clearCart,
                refreshCart,
                cartTotal,
                cartCount,
                isLoading,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
