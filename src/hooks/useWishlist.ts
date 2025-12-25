import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWishlist = () => {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('wishlist_product_ids')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching wishlist:', error);
        } else {
            setWishlist(data?.wishlist_product_ids || []);
        }
        setLoading(false);
    };

    const isInWishlist = (productId: string) => wishlist.includes(productId);

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            toast.error('Please login to add items to your wishlist', {
                action: {
                    label: 'Login',
                    onClick: () => window.location.href = '/login'
                }
            });
            return;
        }

        const isCurrentlyIn = isInWishlist(productId);
        const updated = isCurrentlyIn
            ? wishlist.filter(id => id !== productId)
            : [...wishlist, productId];

        // Optimistic update
        setWishlist(updated);

        const { error } = await supabase
            .from('profiles')
            .update({ wishlist_product_ids: updated })
            .eq('id', user.id);

        if (error) {
            setWishlist(wishlist); // Rollback
            toast.error('Failed to update wishlist');
        } else {
            toast.success(isCurrentlyIn ? 'Removed from wishlist' : 'Added to wishlist ❤️');
        }
    };

    const clearWishlist = async () => {
        if (!user) return;
        setWishlist([]);
        const { error } = await supabase
            .from('profiles')
            .update({ wishlist_product_ids: [] })
            .eq('id', user.id);

        if (error) {
            fetchWishlist(); // Refresh to restore
            toast.error('Failed to clear wishlist');
        } else {
            toast.success('Wishlist cleared');
        }
    };

    return { wishlist, isInWishlist, toggleWishlist, clearWishlist, loading };
};
