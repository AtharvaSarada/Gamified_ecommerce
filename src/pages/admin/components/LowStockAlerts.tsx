import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component or standard UI

interface LowStockItem {
    product_id: string;
    product_name: string;
    variant_size: string;
    stock_quantity: number;
    low_stock_threshold: number;
}

export const LowStockAlerts: React.FC = () => {
    const [items, setItems] = useState<LowStockItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLowStock = async () => {
            try {
                const { data, error } = await supabase.rpc('get_low_stock_products');
                if (error) throw error;
                setItems(data || []);
            } catch (err) {
                console.error('Failed to fetch low stock items:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLowStock();
    }, []);

    if (loading) {
        return (
            <Card className="col-span-4 lg:col-span-2 h-[400px] animate-pulse bg-card/50">
                <CardHeader><div className="h-6 w-32 bg-muted rounded" /></CardHeader>
                <CardContent><div className="h-full bg-muted/10 rounded" /></CardContent>
            </Card>
        );
    }

    // Severity Logic
    const getSeverity = (stock: number) => {
        if (stock === 0) return { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle, label: 'Out of Stock' };
        if (stock < 3) return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle, label: 'Critical' };
        return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertTriangle, label: 'Low' };
    };

    return (
        <Card className="col-span-4 lg:col-span-2 h-[400px] flex flex-col border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-yellow-500 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Inventory Alerts
                </CardTitle>
                <span className="text-xs text-muted-foreground">{items.length} items attention needed</span>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                            <ShoppingCart className="h-8 w-8 opacity-20" />
                            <p>Inventory health is good</p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const severity = getSeverity(item.stock_quantity);
                            const Icon = severity.icon;

                            return (
                                <div key={`${item.product_id}-${item.variant_size}`} className={cn("flex items-center justify-between p-3 rounded-lg border border-border/50", severity.bg)}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-full bg-background/50", severity.color)}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{item.product_name}</p>
                                            <p className="text-xs text-muted-foreground">Size: {item.variant_size}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-sm font-bold", severity.color)}>
                                            {item.stock_quantity} left
                                        </p>
                                        <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                                            {severity.label}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
