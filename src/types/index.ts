// types/index.ts

export type ProductCategory = 'regular' | 'oversized';
export type ProductRarity = 'common' | 'epic' | 'legendary';
export type ShirtSize = 'S' | 'M' | 'L' | 'XL';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    default_shipping_address_id: string | null;
    wishlist_product_ids: string[];
    is_admin: boolean;
    email_verified: boolean;
    level: number;
    xp: number;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    specifications: { key: string; value: string }[] | null;
    size_chart_url: string | null;
    category: ProductCategory;
    rarity: ProductRarity;
    base_price: number;
    discount_percentage: number;
    is_active: boolean;
    is_hero: boolean;
    images: string[];
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    size: ShirtSize;
    stock_quantity: number;
    low_stock_threshold: number;
    sku: string;
}

export interface Order {
    id: string;
    user_id: string | null;
    order_number: string;
    status: OrderStatus;
    subtotal: number;
    discount_amount: number;
    shipping_cost: number;
    total_amount: number;
    payment_status: PaymentStatus;
    payment_provider: 'stripe' | 'razorpay' | null;
    payment_id: string | null;
    shipping_address_id: string | null;
    tracking_number: string | null;
    created_at: string;
    updated_at: string;
}

// Discriminated Unions & Aggregated Types

export type OrderStatusTransition = {
    order_id: string;
    old_status: OrderStatus | null;
    new_status: OrderStatus;
    changed_by: string | null;
    changed_at: string;
    notes?: string;
};

export interface ProductWithStock extends Product {
    variants: ProductVariant[];
    total_stock: number;
    is_in_stock: boolean;
    lowest_price: number;
}

export interface CartWithTotals {
    id: string;
    user_id: string;
    items: CartItemWithProduct[];
    subtotal: number;
    item_count: number;
}

export interface CartItemWithProduct {
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    product: Product;
    variant: ProductVariant;
}

export type DiscountValidation =
    | { valid: true; discount_amount: number }
    | { valid: false; error: string };
