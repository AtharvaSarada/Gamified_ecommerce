export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    phone: string | null
                    is_admin: boolean | null
                    wishlist_product_ids: string[] | null
                    email_notifications: boolean | null
                    promo_notifications: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    is_admin?: boolean | null
                    wishlist_product_ids?: string[] | null
                    email_notifications?: boolean | null
                    promo_notifications?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    is_admin?: boolean | null
                    wishlist_product_ids?: string[] | null
                    email_notifications?: boolean | null
                    promo_notifications?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
            }
            shipping_addresses: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string
                    phone: string
                    address_line1: string
                    address_line2: string | null
                    city: string
                    state: string
                    postal_code: string
                    country: string
                    is_default: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name: string
                    phone: string
                    address_line1: string
                    address_line2?: string | null
                    city: string
                    state: string
                    postal_code: string
                    country: string
                    is_default?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    full_name?: string
                    phone?: string
                    address_line1?: string
                    address_line2?: string | null
                    city?: string
                    state?: string
                    postal_code?: string
                    country?: string
                    is_default?: boolean
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    specifications: Json | null
                    size_chart_url: string | null
                    category: 'regular' | 'oversized'
                    rarity: 'common' | 'epic' | 'legendary'
                    base_price: number
                    discount_percentage: number | null
                    is_active: boolean | null
                    images: string[] | null
                    deleted_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    specifications?: Json | null
                    size_chart_url?: string | null
                    category: 'regular' | 'oversized'
                    rarity: 'common' | 'epic' | 'legendary'
                    base_price: number
                    discount_percentage?: number | null
                    is_active?: boolean | null
                    images?: string[] | null
                    deleted_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    specifications?: Json | null
                    size_chart_url?: string | null
                    category?: 'regular' | 'oversized'
                    rarity?: 'common' | 'epic' | 'legendary'
                    base_price?: number
                    discount_percentage?: number | null
                    is_active?: boolean | null
                    images?: string[] | null
                    deleted_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            product_variants: {
                Row: {
                    id: string
                    product_id: string
                    size: 'S' | 'M' | 'L' | 'XL'
                    stock_quantity: number | null
                    low_stock_threshold: number | null
                    sku: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    size: 'S' | 'M' | 'L' | 'XL'
                    stock_quantity?: number | null
                    low_stock_threshold?: number | null
                    sku: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    size?: 'S' | 'M' | 'L' | 'XL'
                    stock_quantity?: number | null
                    low_stock_threshold?: number | null
                    sku?: string
                }
            }
            carts: {
                Row: {
                    id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    created_at?: string
                }
            }
            cart_items: {
                Row: {
                    id: string
                    cart_id: string
                    product_id: string
                    variant_id: string
                    quantity: number
                    added_at: string
                }
                Insert: {
                    id?: string
                    cart_id: string
                    product_id: string
                    variant_id: string
                    quantity: number
                    added_at?: string
                }
                Update: {
                    id?: string
                    cart_id?: string
                    product_id?: string
                    variant_id?: string
                    quantity?: number
                    added_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    order_number: string
                    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    payment_status: 'pending' | 'paid' | 'failed'
                    total_amount: number
                    shipping_cost: number
                    discount_amount: number
                    promo_code: string | null
                    shipping_address_id: string
                    tracking_number: string | null
                    courier_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    order_number?: string
                    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    payment_status?: 'pending' | 'paid' | 'failed'
                    total_amount: number
                    shipping_cost?: number
                    discount_amount?: number
                    promo_code?: string | null
                    shipping_address_id: string
                    tracking_number?: string | null
                    courier_name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    order_number?: string
                    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    payment_status?: 'pending' | 'paid' | 'failed'
                    total_amount?: number
                    shipping_cost?: number
                    discount_amount?: number
                    promo_code?: string | null
                    shipping_address_id?: string
                    tracking_number?: string | null
                    courier_name?: string | null
                    created_at?: string
                }
            }
        }
        Functions: {
            set_default_address: {
                Args: { address_id: string }
                Returns: void
            }
            cancel_order: {
                Args: { p_order_id: string; p_reason: string }
                Returns: void
            }
            delete_user_account: {
                Args: { p_password: string }
                Returns: void
            }
            admin_update_product_stock: {
                Args: { p_variant_id: string; p_new_stock: number; p_low_stock_threshold: number }
                Returns: void
            }
            admin_restore_all_stock: {
                Args: { p_default_stock: number }
                Returns: number
            }
            admin_create_product: {
                Args: {
                    p_name: string;
                    p_description: string;
                    p_specifications: Json;
                    p_size_chart_url: string | null;
                    p_category: 'regular' | 'oversized';
                    p_rarity: 'common' | 'epic' | 'legendary';
                    p_base_price: number;
                    p_discount_percentage: number;
                    p_images: string[];
                    p_variants: any; // using any for JSONB complexity
                }
                Returns: string // product id
            }
            admin_update_product: {
                Args: {
                    p_product_id: string;
                    p_name: string;
                    p_description: string;
                    p_specifications: Json;
                    p_size_chart_url: string | null;
                    p_category: 'regular' | 'oversized';
                    p_rarity: 'common' | 'epic' | 'legendary';
                    p_base_price: number;
                    p_discount_percentage: number;
                    p_images: string[];
                    p_is_active: boolean;
                }
                Returns: void
            }
            admin_delete_product: {
                Args: { p_product_id: string }
                Returns: void
            }
            apply_discount_code: {
                Args: { p_code: string; p_cart_total: number }
                Returns: {
                    discount_type: string
                    discount_value: number
                    discount_amount: number
                    code: string
                }[]
            }
        }
    }
}
