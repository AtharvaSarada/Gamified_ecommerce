import React, { useState, useEffect } from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductCard, Rarity } from '@/components/ProductCard';

export const WishlistTab: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const { wishlist, loading: wishlistLoading } = useWishlist();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (!user || !wishlist || wishlist.length === 0) {
                setLoading(false);
                setProducts([]);
                return;
            }

            try {
                setLoading(true);
                // Fetch products with variants to calculate stock
                const { data, error } = await supabase
                    .from('products')
                    .select('*, product_variants(stock_quantity)')
                    .in('id', wishlist)
                    .eq('is_active', true)
                    .is('deleted_at', null);

                if (error) throw error;

                // Transform data for ProductCard
                const transformedProducts = (data || []).map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.base_price,
                    images: p.images || [],
                    rarity: p.rarity as Rarity,
                    stock: p.product_variants?.reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0) || 0,
                    fit: p.category as "regular" | "oversized"
                }));

                setProducts(transformedProducts);
            } catch (error) {
                console.error('Error fetching wishlist:', error);
                toast.error('Failed to load wishlist');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && !wishlistLoading) {
            fetchWishlistProducts();
        }
    }, [user, authLoading, wishlistLoading, wishlist]);

    if (authLoading || wishlistLoading || loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/5" />
                ))}
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart size={48} className="text-muted-foreground opacity-20 mb-6" />
                <h2 className="text-2xl font-display font-bold">SAVED FOR LATER</h2>
                <p className="text-muted-foreground mt-2 max-w-xs">
                    Your gear favorites is currently empty. Spot something you like? Save it here.
                </p>
                <Button asChild className="mt-8 font-bold tracking-widest" variant="outline">
                    <Link to="/">EXPLORE ARMORY</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold tracking-tight">SAVED ARSENAL</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {products.length} {products.length === 1 ? 'ITEM' : 'ITEMS'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <ProductCard {...product} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
