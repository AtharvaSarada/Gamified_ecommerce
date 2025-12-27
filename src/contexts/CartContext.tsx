import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { calculatePrice } from "@/utils/pricing";

export interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    name: string;
    price: number; // This is base price
    discountPercentage: number;
    finalPrice: number;
    image: string;
    size: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "id" | "finalPrice">) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    cartSavings: number;
    cartCount: number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    // Load cart on mount or user change
    useEffect(() => {
        const loadCart = async () => {
            setIsLoading(true);
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
              products (name, base_price, discount_percentage, images),
              product_variants (size)
            `)
                        .eq("cart_id", (cartData as any).id);

                    if (itemsData && !itemsError) {
                        const formattedItems: CartItem[] = (itemsData as any[]).map((item: any) => {
                            const { finalPrice } = calculatePrice(item.products.base_price, item.products.discount_percentage);
                            return {
                                id: item.id,
                                productId: item.product_id,
                                variantId: item.variant_id,
                                name: item.products.name,
                                price: item.products.base_price,
                                discountPercentage: item.products.discount_percentage || 0,
                                finalPrice,
                                image: item.products.images?.[0] || "",
                                size: item.product_variants.size,
                                quantity: item.quantity,
                            };
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
            setIsLoading(false);
        };

        loadCart();
    }, [user]);

    // Persist guest cart
    useEffect(() => {
        if (!user) {
            localStorage.setItem("gg_cart", JSON.stringify(items));
        }
    }, [items, user]);

    const addItem = async (newItem: Omit<CartItem, "id" | "finalPrice">) => {
        const { finalPrice } = calculatePrice(newItem.price, newItem.discountPercentage);
        const itemWithPrice: CartItem = {
            ...newItem,
            id: "", // detailed later
            finalPrice
        };

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

                    setItems(prev => prev.map(i =>
                        i.id === existingItem.id
                            ? { ...i, quantity: i.quantity + newItem.quantity }
                            : i
                    ));
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

                    setItems(prev => [...prev, { ...itemWithPrice, id: (insertedItem as any).id }]);
                }
                toast.success("Added to equipment");
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
                setItems(prev => [...prev, { ...itemWithPrice, id: Math.random().toString(36).substr(2, 9) }]);
            }
            toast.success("Added to backpack (Guest mode)");
        }
    };

    const removeItem = async (itemId: string) => {
        if (user) {
            const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
            if (error) {
                toast.error("Could not drop item");
                return;
            }
        }
        setItems(prev => prev.filter(i => i.id !== itemId));
        toast.info("Item dropped");
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        if (user) {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity } as any)
                .eq("id", itemId);
            if (error) {
                toast.error("Calibration failed");
                return;
            }
        }
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
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

    const cartTotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    const cartSavings = items.reduce((sum, item) => {
        const savingsPerItem = item.price - item.finalPrice;
        return sum + (savingsPerItem * item.quantity);
    }, 0);
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                cartTotal,
                cartSavings,
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
