import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Product, ProductVariant, ShirtSize } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageUpload } from './ImageUpload';
import { PriceDisplay } from '@/components/PriceDisplay';

const productSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    specifications: z.array(z.object({
        key: z.string().min(1, 'Header required'),
        value: z.string().min(1, 'Detail required')
    })).optional(),
    category: z.enum(['regular', 'oversized']),
    rarity: z.enum(['common', 'epic', 'legendary']),
    base_price: z.coerce.number().min(0, 'Price must be positive'),
    discount_percentage: z.coerce.number().min(0).max(100).default(0),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    size_chart_images: z.array(z.string()).optional(),
    is_active: z.boolean().default(true),
    variants: z.array(z.object({
        size: z.enum(['S', 'M', 'L', 'XL']),
        stock_quantity: z.coerce.number().min(0),
        low_stock_threshold: z.coerce.number().min(0).default(5),
    })).min(1, 'At least one variant is required')
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productToEdit?: Product & { variants: ProductVariant[] } | null;
    onSuccess: () => void;
}

const SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL'];

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
    open,
    onOpenChange,
    productToEdit,
    onSuccess
}) => {
    const isEditing = !!productToEdit;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            description: '',
            specifications: [],
            category: 'regular',
            rarity: 'common',
            base_price: 0,
            discount_percentage: 0,
            images: [],
            size_chart_images: [],
            is_active: true,
            variants: SIZES.map(size => ({ size, stock_quantity: 10, low_stock_threshold: 5 }))
        }
    });

    const [stagedFiles, setStagedFiles] = React.useState<File[]>([]);
    const [stagedSizeChartFiles, setStagedSizeChartFiles] = React.useState<File[]>([]);

    const { fields: variantFields } = useFieldArray({
        control: form.control,
        name: "variants"
    });

    const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
        control: form.control,
        name: "specifications"
    });

    useEffect(() => {
        if (open) {
            if (productToEdit) {
                // Map existing variants or fill missing ones
                const existingVariants = productToEdit.variants || [];
                const variants = SIZES.map(size => {
                    const existing = existingVariants.find(v => v.size === size);
                    return {
                        size,
                        stock_quantity: existing ? existing.stock_quantity : 0,
                        low_stock_threshold: existing ? existing.low_stock_threshold : 5,
                    };
                });

                // Parse existing specs if they are stored as JSONB, or default to empty
                const specs = Array.isArray(productToEdit.specifications)
                    ? productToEdit.specifications
                    : [];

                form.reset({
                    name: productToEdit.name,
                    description: productToEdit.description || '',
                    specifications: specs as any,
                    category: productToEdit.category,
                    rarity: productToEdit.rarity,
                    base_price: productToEdit.base_price,
                    discount_percentage: productToEdit.discount_percentage || 0,
                    images: productToEdit.images || [],
                    size_chart_images: productToEdit.size_chart_url ? [productToEdit.size_chart_url] : [],
                    is_active: productToEdit.is_active,
                    variants
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                    specifications: [],
                    category: 'regular',
                    rarity: 'common',
                    base_price: 0,
                    discount_percentage: 0,
                    images: [],
                    size_chart_images: [],
                    is_active: true,
                    variants: SIZES.map(size => ({ size, stock_quantity: 50, low_stock_threshold: 5 }))
                });
            }
            setStagedFiles([]);
            setStagedSizeChartFiles([]);
        }
    }, [open, productToEdit, form]);

    const uploadImages = async (files: File[]) => {
        const uploadPromises = files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            return publicUrl;
        });

        return Promise.all(uploadPromises);
    };

    const { accessToken } = useAuth();

    // Helper to race SDK rpc against timeout and fallback to REST
    const callRpc = async (functionName: string, params: any) => {
        console.log(`Admin: Calling RPC '${functionName}'...`);

        // 1. Try SDK with Timeout
        const sdkPromise = supabase.rpc(functionName as any, params);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK_RPC_TIMEOUT')), 5000));

        try {
            const result = await Promise.race([sdkPromise, timeoutPromise]) as any;
            if (result.error) throw result.error;
            console.log(`Admin: RPC '${functionName}' succeeded via SDK`);
            return result.data;
        } catch (err: any) {
            console.warn(`Admin: SDK RPC '${functionName}' failed or timed out (${err.message}). Attempting REST fallback...`);

            if (!accessToken) {
                throw new Error('No access token available for RPC fallback');
            }

            // 2. Fallback to Direct REST Fetch
            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/${functionName}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`RPC Direct fetch failed: ${response.status} ${errorText}`);
            }

            // RPCs might return void (null body) or data
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        try {
            const productId = productToEdit?.id;

            // 1a. Upload Product Images
            const existingUrls = data.images.filter(url => !url.startsWith('blob:'));
            let newUrls: string[] = [];

            if (stagedFiles.length > 0) {
                toast.loading('Uploading images...', { id: 'upload' });
                newUrls = await uploadImages(stagedFiles);
            }

            // 1b. Upload Size Chart Image
            const existingSizeChartUrls = (data.size_chart_images || []).filter(url => !url.startsWith('blob:'));
            let newSizeChartUrls: string[] = [];

            if (stagedSizeChartFiles.length > 0) {
                toast.loading('Uploading size chart...', { id: 'upload-size' });
                newSizeChartUrls = await uploadImages(stagedSizeChartFiles);
                toast.dismiss('upload-size');
            }

            toast.dismiss('upload');

            // 2a. Combine Product URLs
            let newUrlIndex = 0;
            const finalImageUrls = data.images.map(url => {
                if (url.startsWith('blob:')) {
                    return newUrls[newUrlIndex++];
                }
                return url;
            });

            // 2b. Combine Size Chart URLs
            let newSizeChartIndex = 0;
            const finalSizeChartUrls = (data.size_chart_images || []).map(url => {
                if (url.startsWith('blob:')) {
                    return newSizeChartUrls[newSizeChartIndex++];
                }
                return url;
            });
            const sizeChartUrl = finalSizeChartUrls[0] || null;

            if (isEditing && productId) {
                // UPDATE PRODUCT via Robust RPC
                await callRpc('admin_update_product', {
                    p_product_id: productId,
                    p_name: data.name,
                    p_description: data.description || '',
                    p_specifications: data.specifications || [],
                    p_size_chart_url: sizeChartUrl,
                    p_category: data.category,
                    p_rarity: data.rarity,
                    p_base_price: Number(data.base_price),
                    p_discount_percentage: Number(data.discount_percentage),
                    p_images: finalImageUrls,
                    p_is_active: data.is_active
                });

                console.log('Product details updated, proceeding to stock variants update...');

                // Update Stocks via Robust RPC for each variant
                for (const vData of data.variants) {
                    console.log(`Upserting stock for ${vData.size} (Product: ${productId}) to ${vData.stock_quantity}`);
                    await callRpc('admin_update_product_stock', {
                        p_product_id: productId,
                        p_size: vData.size,
                        p_new_stock: Number(vData.stock_quantity),
                        p_low_stock_threshold: Number(vData.low_stock_threshold)
                    });
                }

                toast.success('Product and inventory updated successfully');
            } else {
                // CREATE PRODUCT via Robust RPC
                // Prepare variants JSONB
                const variantsJson = data.variants.map(v => ({
                    size: v.size,
                    stock_quantity: Number(v.stock_quantity),
                    low_stock_threshold: Number(v.low_stock_threshold),
                    sku: `${data.name.substring(0, 3).toUpperCase()}-${v.size}-${Date.now()}`
                }));

                await callRpc('admin_create_product', {
                    p_name: data.name,
                    p_description: data.description || '',
                    p_specifications: data.specifications || [],
                    p_size_chart_url: sizeChartUrl,
                    p_category: data.category,
                    p_rarity: data.rarity,
                    p_base_price: Number(data.base_price),
                    p_discount_percentage: Number(data.discount_percentage),
                    p_images: finalImageUrls,
                    p_variants: variantsJson
                });

                toast.success('Product created successfully');
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving product:', error);
            if (error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
                toast.error('Permission denied: You do not have admin rights or need to run the admin_setup.sql script.');
            } else {
                toast.error(error.message || 'Failed to save product');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] h-[85vh] flex flex-col bg-background/95 backdrop-blur-xl border-white/10 p-0">
                <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
                    <DialogTitle className="font-display tracking-wider text-xl">
                        {isEditing ? 'EDIT DATA CUBE' : 'FORGE NEW ARTIFACT'}
                    </DialogTitle>
                    <DialogDescription>
                        Configuration matrix for {isEditing ? 'existing' : 'new'} equipment.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <ScrollArea className="flex-1 h-full">
                            <div className="space-y-6 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Name</FormLabel>
                                                    <FormControl><Input placeholder="Ex: Neon samurai T-Shirt" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="regular">Regular</SelectItem>
                                                                <SelectItem value="oversized">Oversized</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="rarity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Rarity</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue placeholder="Select rarity" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="common">Common</SelectItem>
                                                                <SelectItem value="epic">Epic</SelectItem>
                                                                <SelectItem value="legendary">Legendary</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="base_price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Price (₹)</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="discount_percentage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Discount %</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Price Preview */}
                                        <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Display Preview</span>
                                            <PriceDisplay
                                                basePrice={Number(form.watch('base_price')) || 0}
                                                discountPercentage={Number(form.watch('discount_percentage')) || 0}
                                                size="md"
                                                showBadge={true}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="images"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Equipment Visualization</FormLabel>
                                                    <FormControl>
                                                        <ImageUpload
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            onFilesChange={setStagedFiles}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                    <p className="text-[10px] text-muted-foreground italic">
                                                        * Drag and drop to reorder. The first image will be used as the primary artifact preview.
                                                    </p>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>About the Product</FormLabel>
                                                    <FormControl><Textarea className="min-h-[100px]" placeholder="Main product description..." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Dynamic Specifications */}
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Specifications</FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => appendSpec({ key: '', value: '' })}
                                                    className="h-8 text-xs uppercase font-bold text-primary hover:bg-primary/10"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add Spec
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                {specFields.map((field, index) => (
                                                    <div key={field.id} className="flex gap-2 items-start group">
                                                        <FormField
                                                            control={form.control}
                                                            name={`specifications.${index}.key`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-1 space-y-0">
                                                                    <FormControl>
                                                                        <Input placeholder="Header (e.g. Material)" className="h-9 text-xs" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage className="text-[10px]" />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`specifications.${index}.value`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-[2] space-y-0">
                                                                    <FormControl>
                                                                        <Input placeholder="Detail (e.g. 100% Cotton)" className="h-9 text-xs" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage className="text-[10px]" />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeSpec(index)}
                                                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {specFields.length === 0 && (
                                                    <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-white/5 rounded-lg bg-white/2 italic">
                                                        No specifications added yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="size_chart_images"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Size Chart</FormLabel>
                                                    <FormControl>
                                                        <ImageUpload
                                                            value={field.value || []}
                                                            onChange={field.onChange}
                                                            onFilesChange={setStagedSizeChartFiles}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                    <p className="text-[10px] text-muted-foreground italic">
                                                        * Upload a size chart image.
                                                    </p>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ImageIcon size={16} /> Inventory Matrix
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {variantFields.map((field, index) => (
                                            <div key={field.id} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-2">
                                                <div className="font-bold text-center text-primary">{form.getValues(`variants.${index}.size`)}</div>
                                                <FormField
                                                    control={form.control}
                                                    name={`variants.${index}.stock_quantity`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <div className="text-[10px] text-muted-foreground uppercase text-center pb-1">Stock</div>
                                                            <FormControl>
                                                                <Input type="number" className="h-8 text-center" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border border-white/5 p-4 bg-white/2">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Active Status</FormLabel>
                                                <DialogDescription>
                                                    Visible in the store for players to loot.
                                                </DialogDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-6 py-4 border-t border-white/10 shrink-0 bg-background/95 backdrop-blur-xl">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                CANCEL
                            </Button>
                            <Button type="submit" variant="cyber" disabled={form.formState.isSubmitting} className="min-w-[150px]">
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                {isEditing ? 'SAVE CONFIG' : 'INITIALIZE'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
