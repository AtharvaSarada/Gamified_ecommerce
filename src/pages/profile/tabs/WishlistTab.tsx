import React, { useState, useEffect } from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

type Product = any;

export const WishlistTab: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const { wishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
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
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .in('id', wishlist)
                    .eq('is_active', true)
                    .is('deleted_at', null);

                if (error) throw error;
                setProducts(data || []);
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
                            className="group relative bg-[#0a0e27]/50 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,255,240,0.1)]"
                        >
                            <div className="aspect-[4/5] relative overflow-hidden">
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <button
                                    onClick={() => toggleWishlist(product.id)}
                                    className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-md rounded-full text-primary shadow-lg hover:scale-110 transition-transform active:scale-90"
                                >
                                    <Heart size={16} fill="currentColor" />
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide line-clamp-1">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">₹{(product.base_price || product.price || 0).toLocaleString()}</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button className="flex-1 text-[10px] font-bold tracking-widest h-9 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transform active:scale-95 transition-all">
                                        <ShoppingCart size={14} className="mr-2" /> ADD TO BAG
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
