import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Product, ProductWithStock } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Search, Plus, Edit, Trash2, RefreshCw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ProductFormDialog } from '@/pages/admin/components/ProductFormDialog';
import { formatPrice } from '@/lib/utils';

export const AdminProductsTab: React.FC = () => {
    const { accessToken } = useAuth();
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            console.log('Admin: Fetching products...');

            // Priority: Direct REST Fetch
            // We bypass the SDK select() entirely to avoid the 5s timeout on every load
            if (accessToken) {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=*,variants:product_variants(*)&order=created_at.desc`;
                const response = await fetch(url, {
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (!response.ok) throw new Error(`Direct fetch failed: ${response.statusText}`);
                const data = await response.json();

                // Transform to include stock summary
                const transformedWithStock = (data || []).map((p: any) => ({
                    ...p,
                    total_stock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0,
                    is_in_stock: p.variants?.some((v: any) => (v.stock_quantity || 0) > 0),
                }));

                setProducts(transformedWithStock);
                console.log('Admin: Products fetched via direct REST');
            } else {
                // Fallback to SDK if no token (rare)
                console.warn('Admin: No access token, using SDK for fetch...');
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        variants:product_variants(*)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const transformedWithStock = (data || []).map((p: any) => ({
                    ...p,
                    total_stock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0,
                    is_in_stock: p.variants?.some((v: any) => (v.stock_quantity || 0) > 0),
                }));
                setProducts(transformedWithStock);
            }
        } catch (error: any) {
            console.error('Error fetching products:', error);
            toast.error(error.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleRestoreAllStock = async () => {
        try {
            let data;
            if (accessToken) {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/admin_restore_all_stock`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_default_stock: 50 })
                });
                if (!response.ok) throw new Error('Failed to restore');
                data = await response.json();
            } else {
                const { data: rpcData, error } = await (supabase.rpc as any)('admin_restore_all_stock', {
                    p_default_stock: 50
                });
                if (error) throw error;
                data = rpcData;
            }

            toast.success(`All systems online: ${data} variants restored to max capacity.`);
            fetchProducts();
        } catch (error: any) {
            console.error('Error restoring stock:', error);
            toast.error(error.message || 'Failed to restore stock');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            if (accessToken) {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/admin_delete_product`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_product_id: id })
                });
                if (!response.ok) throw new Error('Failed to delete');
            } else {
                const { error } = await (supabase.rpc as any)('admin_delete_product', {
                    p_product_id: id
                });
                if (error) throw error;
            }

            toast.success('Product removed from database');
            fetchProducts();
        } catch (error: any) {
            console.error('Error deleting product:', error);
            toast.error(error.message || 'Failed to delete product');
        }
    };

    const handleSetHero = async (id: string, currentIsHero: boolean) => {
        if (currentIsHero) return; // Already hero, do nothing

        try {
            if (accessToken) {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/set_hero_product`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_product_id: id })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to set hero: ${response.status} ${errorText}`);
                }
            } else {
                const { error } = await (supabase.rpc as any)('set_hero_product', {
                    p_product_id: id
                });
                if (error) throw error;
            }

            toast.success('Hero product updated');
            fetchProducts();
        } catch (error: any) {
            console.error('Error setting hero product:', error);
            toast.error(error.message || 'Failed to set hero product');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // Priority: Direct REST API Call for instant update
            if (!accessToken) {
                throw new Error('No access token available for status update');
            }

            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?id=eq.${id}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal' // Don't need the return body, just the status code
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Direct update failed: ${response.status} ${errorText}`);
            }

            toast.success(`Artifact ${!currentStatus ? 'activated' : 'archived'} successfully`);
            fetchProducts();
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error(error.message || 'Failed to update status');
        }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search artifacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleRestoreAllStock} className="flex-1 sm:flex-none border-green-500/30 text-green-500 hover:bg-green-500/10">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        RESTORE ALL STOCK
                    </Button>
                    <Button variant="cyber" onClick={() => { setSelectedProduct(null); setIsDialogOpen(true); }} className="flex-1 sm:flex-none">
                        <Plus className="mr-2 h-4 w-4" />
                        NEW ARTIFACT
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead>Preview</TableHead>
                            <TableHead>Accession Data</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock Status</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No artifacts found in the database.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((product) => (
                                <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden border border-white/10">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">NO IMG</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold">{product.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{product.description || 'No description'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit text-[10px] uppercase">{product.category}</Badge>
                                            <Badge variant={product.rarity === 'legendary' ? 'default' : 'secondary'} className="w-fit text-[10px] uppercase">
                                                {product.rarity}
                                            </Badge>
                                            {product.is_hero && (
                                                <Badge className="w-fit text-[10px] uppercase bg-yellow-500/20 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/30">
                                                    Hero
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={product.is_active}
                                                onCheckedChange={() => toggleStatus(product.id, product.is_active)}
                                            />
                                            <span className={`text-xs font-bold uppercase ${product.is_active ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                {product.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Total Stock: {product.total_stock}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">
                                        {formatPrice(product.base_price)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsDialogOpen(true); }}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleSetHero(product.id, product.is_hero)}
                                                className={product.is_hero ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"}
                                                title="Set as Hero Product"
                                            >
                                                <Star className={`w-4 h-4 ${product.is_hero ? "fill-current" : ""}`} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProductFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                productToEdit={selectedProduct as any}
                onSuccess={fetchProducts}
            />
        </div>
    );
};
