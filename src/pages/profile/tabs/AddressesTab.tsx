import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Edit2, Trash2, Home, Globe } from 'lucide-react';
import { AddressesSkeleton } from '@/components/ui/Skeletons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShippingForm, ShippingFormData } from '@/components/checkout/ShippingForm';

type Address = any;

export const AddressesTab: React.FC = () => {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        if (user) fetchAddresses();
    }, [user]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('shipping_addresses')
                .select('*')
                .eq('user_id', user?.id)
                .order('is_default', { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (err) {
            console.error("Address fetch error:", err);
            toast.error("Failed to load addresses");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (data: ShippingFormData) => {
        if (addresses.length >= 4) {
            toast.error("Limit Reached: You can save up to 4 deployment zones.");
            return;
        }

        try {
            const { error } = await supabase.from('shipping_addresses').insert({
                user_id: user?.id,
                full_name: data.fullName,
                phone: data.phone,
                address_line1: data.addressLine1,
                address_line2: data.addressLine2,
                city: data.city,
                state: data.state,
                postal_code: data.pinCode,
                country: 'IN', // Hardcoded for now
                is_default: addresses.length === 0 // Make default if first address
            });

            if (error) throw error;

            toast.success("Deployment Zone Added!");
            setIsAddOpen(false);
            fetchAddresses();
        } catch (error: any) {
            console.error("Add Address Error:", error);
            toast.error(error.message || "Failed to add address");
        }
    };

    const setDefault = async (id: string) => {
        const { error } = await supabase.rpc('set_default_address', { address_id: id } as any);
        // Note: set_default_address RPC needs to be verified if it exists, otherwise manual update
        // If RPC doesn't exist, we can do it manually:
        // await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
        // await supabase.from('shipping_addresses').update({ is_default: true }).eq('id', id);

        if (error) {
            // Fallback manual update if RPC fails
            await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user?.id);
            await supabase.from('shipping_addresses').update({ is_default: true }).eq('id', id);
            toast.success('Default address updated');
            fetchAddresses();
        } else {
            toast.success('Default address updated');
            fetchAddresses();
        }
    };

    const deleteAddress = async (id: string) => {
        const { error } = await supabase
            .from('shipping_addresses')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete address');
        } else {
            toast.success('Address deleted');
            fetchAddresses();
        }
    };

    if (loading && addresses.length === 0) return <AddressesSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">DEPLOYMENT DROPS</h2>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="font-bold tracking-widest flex items-center gap-2">
                            <Plus size={16} /> ADD NEW
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="font-display uppercase tracking-widest">Add New Deployment Zone</DialogTitle>
                            <DialogDescription>
                                Add a new shipping address for faster checkout.
                            </DialogDescription>
                        </DialogHeader>
                        <ShippingForm
                            onSubmit={handleAddAddress}
                            mode="address_book"
                            // Mock serviceability check logic strictly for this form or reuse proper one
                            onPinCodeChange={() => { }}
                            isServiceable={true}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {addresses.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <MapPin size={40} className="text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-lg font-bold">NO DEPLOYMENT ZONES</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Save your shipping addresses for faster gear drops.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {addresses.map((addr) => (
                            <motion.div
                                key={addr.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden",
                                    addr.is_default
                                        ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(0,255,240,0.05)]"
                                        : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5"
                                )}
                            >
                                {addr.is_default && (
                                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold tracking-tighter rounded-bl-xl uppercase shadow-glow">
                                        Primary Zone
                                    </div>
                                )}

                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        {addr.is_default ? <Home size={18} className="text-primary" /> : <Globe size={18} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm tracking-wide">{addr.full_name}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-1 text-sm text-muted-foreground font-medium">
                                    <p className="line-clamp-1">{addr.address_line1}</p>
                                    {addr.address_line2 && <p className="line-clamp-1">{addr.address_line2}</p>}
                                    <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                                    <p className="text-xs font-bold uppercase tracking-widest mt-2">{addr.country}</p>
                                </div>

                                <div className="mt-6 flex gap-2 pt-4 border-t border-white/5">
                                    {!addr.is_default && (
                                        <Button
                                            onClick={() => setDefault(addr.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-[10px] font-bold uppercase hover:bg-primary/10 tracking-widest"
                                        >
                                            Set Primary
                                        </Button>
                                    )}
                                    {/* Edit functionality not implemented yet */}
                                    {/* 
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto hover:bg-white/10">
                                        <Edit2 size={14} />
                                    </Button>
                                    */}
                                    <Button
                                        onClick={() => deleteAddress(addr.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 ml-auto"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
