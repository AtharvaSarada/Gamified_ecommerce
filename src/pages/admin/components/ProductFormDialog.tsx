import React, { useEffect } from 'react';
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
import { Tab } from '@headlessui/react'; // Assuming headless ui or using standard tabs
import { Product, ProductVariant, ShirtSize } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageUpload } from './ImageUpload';

const productSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    category: z.enum(['regular', 'oversized']),
    rarity: z.enum(['common', 'epic', 'legendary']),
    base_price: z.coerce.number().min(0, 'Price must be positive'),
    discount_percentage: z.coerce.number().min(0).max(100).default(0),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    is_active: z.boolean().default(true),
    variants: z.array(z.object({
        size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
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

const SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL'];

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
            category: 'regular',
            rarity: 'common',
            base_price: 0,
            discount_percentage: 0,
            images: [],
            is_active: true,
            variants: SIZES.map(size => ({ size, stock_quantity: 10, low_stock_threshold: 5 }))
        }
    });

    const [stagedFiles, setStagedFiles] = React.useState<File[]>([]);

    const { fields } = useFieldArray({
        control: form.control,
        name: "variants"
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

                form.reset({
                    name: productToEdit.name,
                    description: productToEdit.description || '',
                    category: productToEdit.category,
                    rarity: productToEdit.rarity,
                    base_price: productToEdit.base_price,
                    discount_percentage: productToEdit.discount_percentage || 0,
                    images: productToEdit.images || [],
                    is_active: productToEdit.is_active,
                    variants
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                    category: 'regular',
                    rarity: 'common',
                    base_price: 0,
                    discount_percentage: 0,
                    images: [],
                    is_active: true,
                    variants: SIZES.map(size => ({ size, stock_quantity: 50, low_stock_threshold: 5 }))
                });
            }
            setStagedFiles([]);
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

    const onSubmit = async (data: ProductFormValues) => {
        try {
            const productId = productToEdit?.id;

            // 1. Filter out blob URLs and upload actual files
            const existingUrls = data.images.filter(url => !url.startsWith('blob:'));
            let newUrls: string[] = [];

            if (stagedFiles.length > 0) {
                toast.loading('Uploading images...', { id: 'upload' });
                newUrls = await uploadImages(stagedFiles);
                toast.dismiss('upload');
            }

            // 2. Combine URLs in order (relying on the order in data.images)
            // Replace blob URLs in data.images with their uploaded equivalents
            let newUrlIndex = 0;
            const finalImageUrls = data.images.map(url => {
                if (url.startsWith('blob:')) {
                    return newUrls[newUrlIndex++];
                }
                return url;
            });

            if (isEditing && productId) {
                // UPDATE PRODUCT via RPC
                const { error: updateError } = await supabase.rpc('admin_update_product', {
                    p_product_id: productId,
                    p_name: data.name,
                    p_description: data.description || '',
                    p_category: data.category,
                    p_rarity: data.rarity,
                    p_base_price: Number(data.base_price),
                    p_discount_percentage: Number(data.discount_percentage),
                    p_images: finalImageUrls,
                    p_is_active: data.is_active
                });

                if (updateError) throw updateError;

                console.log('Product details updated, proceeding to stock variants update...');

                // Update Stocks via RPC for each variant
                // We use an UPSERT pattern so it works even if variants are missing
                for (const vData of data.variants) {
                    console.log(`Upserting stock for ${vData.size} (Product: ${productId}) to ${vData.stock_quantity}`);
                    const { error: stockError } = await supabase.rpc('admin_update_product_stock', {
                        p_product_id: productId,
                        p_size: vData.size,
                        p_new_stock: Number(vData.stock_quantity),
                        p_low_stock_threshold: Number(vData.low_stock_threshold)
                    });

                    if (stockError) {
                        console.error(`Failed to update stock for ${vData.size}:`, stockError);
                        throw new Error(`Stock update failed for ${vData.size}: ${stockError.message}`);
                    }
                }

                toast.success('Product and inventory updated successfully');
            } else {
                // CREATE PRODUCT via RPC
                // Prepare variants JSONB
                const variantsJson = data.variants.map(v => ({
                    size: v.size,
                    stock_quantity: Number(v.stock_quantity),
                    low_stock_threshold: Number(v.low_stock_threshold),
                    sku: `${data.name.substring(0, 3).toUpperCase()}-${v.size}-${Date.now()}`
                }));

                const { error: createError } = await supabase.rpc('admin_create_product', {
                    p_name: data.name,
                    p_description: data.description || '',
                    p_category: data.category,
                    p_rarity: data.rarity,
                    p_base_price: Number(data.base_price),
                    p_discount_percentage: Number(data.discount_percentage),
                    p_images: finalImageUrls,
                    p_variants: variantsJson
                });

                if (createError) throw createError;
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle className="font-display tracking-wider text-xl">
                        {isEditing ? 'EDIT DATA CUBE' : 'FORGE NEW ARTIFACT'}
                    </DialogTitle>
                    <DialogDescription>
                        Configuration matrix for {isEditing ? 'existing' : 'new'} equipment.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-6 p-1">
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
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Stock Matrix */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ImageIcon size={16} /> Inventory Matrix
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {fields.map((field, index) => (
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

                        <DialogFooter className="pt-6 mt-6 border-t border-white/10">
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
