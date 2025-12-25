import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, ProductWithStock } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Search, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ProductFormDialog } from '@/pages/admin/components/ProductFormDialog';

export const AdminProductsTab: React.FC = () => {
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            console.log('Admin: Fetching products...');

            // 1. Try SDK with Timeout
            const sdkPromise = supabase
                .from('products')
                .select(`
                    *,
                    variants:product_variants(*)
                `)
                .order('created_at', { ascending: false });

            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK_FETCH_TIMEOUT')), 5000));

            let data;
            try {
                const result = await Promise.race([sdkPromise, timeoutPromise]) as any;
                data = result.data;
                if (result.error) throw result.error;
                console.log('Admin: Products fetched via SDK');
            } catch (sdkErr: any) {
                console.warn('Admin: SDK fetch failed or timed out, trying direct REST fallback...', sdkErr.message);

                // 2. Fallback to Direct REST Fetch
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;

                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=*,variants:product_variants(*)&order=created_at.desc`;
                const response = await fetch(url, {
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (!response.ok) throw new Error(`Direct fetch failed: ${response.statusText}`);
                data = await response.json();
                console.log('Admin: Products fetched via direct REST fallback');
            }

            // Transform to include stock summary
            const transformedWithStock = (data || []).map((p: any) => ({
                ...p,
                total_stock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0,
                is_in_stock: p.variants?.some((v: any) => (v.stock_quantity || 0) > 0),
            }));

            setProducts(transformedWithStock);
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
            const { data, error } = await (supabase.rpc as any)('admin_restore_all_stock', {
                p_default_stock: 50
            });

            if (error) throw error;

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
            const { error } = await (supabase.rpc as any)('admin_delete_product', {
                p_product_id: id
            });

            if (error) throw error;
            toast.success('Product removed from database');
            fetchProducts();
        } catch (error: any) {
            console.error('Error deleting product:', error);
            toast.error(error.message || 'Failed to delete product');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await (supabase
                .from('products') as any)
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchProducts();
        } catch (error) {
            toast.error('Failed to update status');
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
                                        ₹{product.base_price}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsDialogOpen(true); }}>
                                                <Edit className="w-4 h-4" />
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
