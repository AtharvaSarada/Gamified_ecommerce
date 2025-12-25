import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard, Rarity } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase, directFetchProducts } from "@/lib/supabase";
import { Loader2, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fetchAllProducts = async () => {
    try {
        const data = await directFetchProducts("select=id,name,base_price,rarity,category,images,product_variants(stock_quantity)&is_active=eq.true&deleted_at=is.null");

        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.base_price,
            images: p.images || [],
            rarity: p.rarity as Rarity,
            stock: p.product_variants?.reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0) || 0,
            fit: p.category as "regular" | "oversized",
        }));
    } catch (err) {
        console.error("Shop fetch failure:", err);
        throw err;
    }
};

import { useSearchParams } from "react-router-dom";

// ... existing imports

export function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get("category");
    const [activeCategory, setActiveCategory] = useState<string>(
        (initialCategory === "regular" || initialCategory === "oversized") ? initialCategory : "all"
    );
    const [activeRarity, setActiveRarity] = useState<string>("all");

    // Sync state with URL if it changes (e.g. back button)
    React.useEffect(() => {
        const category = searchParams.get("category");
        if (category && (category === "regular" || category === "oversized")) {
            setActiveCategory(category);
        } else if (!category) {
            setActiveCategory("all");
        }
    }, [searchParams]);

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        if (cat === "all") {
            searchParams.delete("category");
        } else {
            searchParams.set("category", cat);
        }
        setSearchParams(searchParams);
    };

    const { data: products, isLoading, error } = useQuery({
        queryKey: ["all-products"],
        queryFn: fetchAllProducts,
    });

    const filteredProducts = products?.filter((product) => {
        const categoryMatch = activeCategory === "all" || product.fit === activeCategory;
        const rarityMatch = activeRarity === "all" || product.rarity === activeRarity;
        return categoryMatch && rarityMatch;
    }) || [];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase italic neon-text mb-4">
                            ARMORY <span className="text-primary">ACCESS</span>
                        </h1>
                        <p className="text-muted-foreground uppercase tracking-widest text-sm max-w-2xl">
                            Equip the latest tactical gear. Filter by fit and rarity to find your perfect loadout.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className="lg:w-64 shrink-0 space-y-8">
                            <div className="p-6 bg-card border-2 border-primary/20 angular-card relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/40" />

                                <h2 className="font-display font-bold text-lg tracking-tight uppercase flex items-center gap-2 mb-6">
                                    <Filter className="w-4 h-4 text-primary" />
                                    FILTER_SYSTEM
                                </h2>

                                <div className="space-y-6">
                                    {/* Category Filter */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
                                            FIT_CATEGORY
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {["all", "regular", "oversized"].map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => handleCategoryChange(cat)}
                                                    className={cn(
                                                        "text-left px-3 py-2 text-xs font-display font-bold tracking-widest uppercase transition-all border",
                                                        activeCategory === cat
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "text-muted-foreground border-transparent hover:border-primary/30 hover:bg-primary/5"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rarity Filter */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
                                            RARITY_GRADE
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {["all", "common", "epic", "legendary"].map((rare) => (
                                                <button
                                                    key={rare}
                                                    onClick={() => setActiveRarity(rare)}
                                                    className={cn(
                                                        "text-left px-3 py-2 text-xs font-display font-bold tracking-widest uppercase transition-all border",
                                                        activeRarity === rare
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "text-muted-foreground border-transparent hover:border-primary/30 hover:bg-primary/5"
                                                    )}
                                                >
                                                    {rare}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div className="flex-1">
                            {isLoading ? (
                                <div className="h-96 flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="p-12 border-2 border-destructive/30 bg-destructive/5 text-destructive text-center angular-card">
                                    <p className="font-display font-bold uppercase">System Error: Failed to retrieve armory data</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-24 border-2 border-dashed border-primary/10 text-center angular-card">
                                    <p className="font-display font-bold text-muted-foreground uppercase">No gear found with current filters</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ProductCard {...product} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
