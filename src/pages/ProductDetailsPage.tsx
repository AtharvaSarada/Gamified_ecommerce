import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase, directFetchProducts } from "@/lib/supabase";
import { Loader2, ArrowLeft, ShieldCheck, Zap, Info, Plus, Minus, ShoppingCart, X, Maximize2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { ReportReviewModal } from "@/components/reviews/ReportReviewModal";
import { useAuth } from "@/contexts/AuthContext";
import { checkProfanity } from "@/utils/profanityFilter"; // Just to ensure import exists if used




const fetchProductById = async (id: string) => {
    try {
        const data = await directFetchProducts(`select=*,product_variants(*)&id=eq.${id}`);
        return data?.[0] || null;
    } catch (err) {
        console.error("Product fetch failure:", err);
        throw err;
    }
};

export function ProductDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Fetch Product First (Fix Hoisting Issue)
    const { data: product, isLoading, error } = useQuery({
        queryKey: ["product", id],
        queryFn: () => fetchProductById(id!),
        enabled: !!id,
    });

    // Review System State
    const { user } = useAuth();
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [ratingData, setRatingData] = useState<any>(null);
    const [userReviewStatus, setUserReviewStatus] = useState<{ hasPurchased: boolean; hasReviewed: boolean }>({ hasPurchased: false, hasReviewed: false });
    const [optimisticReviews, setOptimisticReviews] = useState<any[]>([]);

    // Reset image selection when product changes
    React.useEffect(() => {
        setSelectedImageIndex(0);
        setOptimisticReviews([]);
        setIsReviewFormOpen(false);
    }, [id]);

    // Fetch Ratings & User Status
    React.useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            // 1. Fetch Rating Summary
            // Try cache first
            let { data: summary, error } = await supabase
                .from('product_rating_cache')
                .select('*')
                .eq('product_id', id)
                .single();

            if (!summary || error) {
                // Fallback to RPC
                const { data: rpcData } = await supabase.rpc('get_product_rating_summary' as any, { p_id: id } as any);
                if (rpcData && (rpcData as any).length > 0) {
                    summary = (rpcData as any)[0];
                }
            }

            // Default if nothing
            if (!summary) {
                summary = { avg_rating: 0, review_count: 0, five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 };
            }
            setRatingData(summary);

            // 2. Check User Status (if logged in)
            if (user) {
                const { data: purchased } = await supabase.rpc('check_user_purchased_product', { u_id: user.id, p_id: id });
                // Check if already reviewed (client side check or simple select)
                const { count } = await supabase.from('reviews')
                    .select('id', { count: 'exact', head: true })
                    .eq('product_id', id)
                    .eq('user_id', user.id);

                setUserReviewStatus({
                    hasPurchased: purchased || false,
                    hasReviewed: (count || 0) > 0
                });
            }
        };

        fetchData();
    }, [id, user]);

    // JSON-LD Injection
    React.useEffect(() => {
        if (!product || !ratingData) return;
        const p = product as any;

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": p.name,
            "description": p.description,
            "image": p.images || [],
            "sku": p.id,
            "offers": {
                "@type": "Offer",
                "priceCurrency": "USD", // Or dynamic
                "price": p.base_price,
                "availability": "https://schema.org/InStock"
            },
            "aggregateRating": ratingData.review_count > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": ratingData.avg_rating,
                "reviewCount": ratingData.review_count,
                "bestRating": "5",
                "worstRating": "1"
            } : undefined
        });

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [product, ratingData]);

    // Optimistic Handlers
    const handleOptimisticAdd = (review: any) => {
        setOptimisticReviews(prev => [review, ...prev]);
        setIsReviewFormOpen(false);
        setUserReviewStatus(prev => ({ ...prev, hasReviewed: true }));
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleOptimisticRemove = (tempId: string) => {
        setOptimisticReviews(prev => prev.filter(r => r.id !== tempId));
        setUserReviewStatus(prev => ({ ...prev, hasReviewed: false }));
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleOptimisticReplace = (tempId: string, realReview: any) => {
        setOptimisticReviews(prev => prev.map(r => r.id === tempId ? realReview : r));
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
                <div>
                    <h1 className="text-2xl font-display font-bold text-destructive mb-4 uppercase tracking-tighter">Gear Not Found</h1>
                    <Button variant="outline" onClick={() => navigate(-1)}>RETURN TO ARMORY</Button>
                </div>
            </div>
        );
    }

    const p = product as any;

    const handleAddToCart = () => {
        if (!selectedSize) return;

        const variant = p.product_variants.find((v: any) => v.size === selectedSize);
        if (!variant) return;

        addItem({
            productId: p.id,
            variantId: variant.id,
            name: p.name,
            price: p.base_price,
            // discountPercentage: p.discount_percentage || 0, // Removed to fix type error
            image: p.images?.[0] || "",
            size: selectedSize,
            quantity,
        });
    };

    const currentVariant = p.product_variants.find((v: any) => v.size === selectedSize);
    const isOutOfStock = currentVariant ? currentVariant.stock_quantity === 0 : true;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            {/* Lightbox Overlay */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="w-full max-w-5xl max-h-[90vh] relative flex items-center justify-center">
                        <img
                            src={p.images?.[selectedImageIndex] || p.images?.[0]}
                            alt={p.name}
                            className="max-w-full max-h-[90vh] object-contain"
                        />

                        {/* Lightbox Navigation (if multiple images) */}
                        {p.images && p.images.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {p.images.map((_: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            selectedImageIndex === idx ? "bg-primary scale-125" : "bg-white/30 hover:bg-white/50"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-8 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        BACK_TO_LIST
                    </Button>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Visual Section */}
                        <div className="space-y-6">
                            {/* Main Image Stage */}
                            <div className="group relative aspect-square bg-card border-2 border-primary/20 angular-card overflow-hidden">
                                <img
                                    src={p.images?.[selectedImageIndex] || p.images?.[0]}
                                    alt={p.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                    onClick={() => setIsLightboxOpen(true)}
                                />

                                {/* Zoom Hint */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded backdrop-blur-sm pointer-events-none z-20">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                </div>

                                {/* Rarity Overlay */}
                                <div className={cn(
                                    "absolute top-4 left-4 px-3 py-1 border font-display font-bold text-xs tracking-widest uppercase rounded-sm z-10",
                                    p.rarity === 'legendary' ? "bg-rarity-legendary/20 text-rarity-legendary border-rarity-legendary/50 animate-glow-pulse" :
                                        p.rarity === 'epic' ? "bg-rarity-epic/20 text-rarity-epic border-rarity-epic/50" :
                                            "bg-muted/80 text-muted-foreground border-border"
                                )}>
                                    {p.rarity}
                                </div>
                            </div>

                            {/* Thumbnails Gallery */}
                            {p.images && p.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-4">
                                    {p.images.map((img: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={cn(
                                                "aspect-square overflow-hidden border-2 transition-all angular-card relative group",
                                                selectedImageIndex === idx
                                                    ? "border-primary opacity-100 ring-2 ring-primary/20"
                                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-primary/50"
                                            )}
                                        >
                                            <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                            {selectedImageIndex === idx && (
                                                <div className="absolute inset-0 bg-primary/10" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Specs Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-card border-2 border-white/5 angular-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</span>
                                    </div>
                                    <p className="font-display font-black text-lg uppercase italic">{p.category}</p>
                                </div>
                                <div className="p-4 bg-card border-2 border-white/5 angular-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">StockStatus</span>
                                    </div>
                                    <p className={cn(
                                        "font-display font-black text-lg uppercase italic",
                                        isOutOfStock ? "text-destructive" : "text-primary"
                                    )}>
                                        {isOutOfStock ? "LOOTED" : "READY"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex flex-col">
                            <div className="mb-8">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter uppercase italic neon-text mb-4">
                                    {p.name}
                                </h1>
                                {ratingData && ratingData.review_count > 0 && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center text-yellow-500">
                                            <span className="font-bold mr-1">{Number(ratingData.avg_rating).toFixed(1)}</span>
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 ${i < Math.round(ratingData.avg_rating) ? 'fill-current' : 'text-gray-600 fill-current opacity-20'}`} viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4">
                                            {ratingData.review_count} reviews
                                        </a>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-6">
                                    <PriceDisplay
                                        basePrice={p.base_price}
                                        discountPercentage={p.discount_percentage}
                                        size="lg"
                                        showBadge={true}
                                    />
                                </div>
                                <div className="space-y-6 mt-8">
                                    {/* 1. About */}
                                    <div>
                                        <h3 className="font-display font-bold text-sm text-muted-foreground mb-2 uppercase tracking-widest">About the Product</h3>
                                        <p className="text-foreground/80 text-sm leading-relaxed tracking-wide border-l-2 border-primary/30 pl-4 py-2 bg-primary/5">
                                            {p.description || "No description available."}
                                        </p>
                                    </div>

                                    {/* 2. Specifications */}
                                    {p.specifications && Array.isArray(p.specifications) && p.specifications.length > 0 && (
                                        <div>
                                            <h3 className="font-display font-bold text-sm text-muted-foreground mb-4 uppercase tracking-widest">Specifications</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {(p.specifications as any[]).map((spec, idx) => (
                                                    <div key={idx} className="bg-primary/5 border border-primary/10 rounded-sm p-3 relative group overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-300" />
                                                        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">
                                                            {spec.key}
                                                        </h4>
                                                        <p className="text-sm font-medium text-foreground tracking-wide">
                                                            {spec.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Size Chart */}
                                    {p.size_chart_url && (
                                        <div>
                                            <h3 className="font-display font-bold text-sm text-muted-foreground mb-2 uppercase tracking-widest">Size Guide</h3>
                                            <a
                                                href={p.size_chart_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all rounded-sm font-bold uppercase tracking-wider text-xs group"
                                            >
                                                <Info className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                                View Size Chart
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selection Section */}
                            <div className="space-y-8 bg-card/50 p-6 border-2 border-white/5 angular-card relative">
                                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/20" />

                                {/* Size Selection */}
                                <div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        SELECT_SIZE_VARIANT
                                        <Info className="w-3 h-3" />
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {p.product_variants.map((v: any) => (
                                            <button
                                                key={v.size}
                                                disabled={v.stock_quantity === 0}
                                                onClick={() => setSelectedSize(v.size)}
                                                className={cn(
                                                    "w-14 h-14 flex items-center justify-center font-display font-black border-2 transition-all relative overflow-hidden group",
                                                    selectedSize === v.size
                                                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(0,255,240,0.3)]"
                                                        : "bg-transparent text-muted-foreground border-border hover:border-primary/50",
                                                    v.stock_quantity === 0 && "opacity-30 cursor-not-allowed bg-muted/20"
                                                )}
                                            >
                                                {v.size}
                                                {v.stock_quantity > 0 && v.stock_quantity <= 5 && (
                                                    <div className="absolute top-0 right-0 w-2 h-2 bg-accent" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quantity & Action */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <div className="flex items-center bg-background/50 border-2 border-white/10 angular-card p-1">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-10 h-10 flex items-center justify-center hover:text-primary transition-colors"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <span className="w-12 text-center font-display font-black text-xl tabular-nums">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-10 h-10 flex items-center justify-center hover:text-primary transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <Button
                                        variant="cyber"
                                        size="lg"
                                        className="flex-1 h-auto py-5 text-xl font-black italic tracking-widest group"
                                        disabled={!selectedSize || isOutOfStock}
                                        onClick={handleAddToCart}
                                    >
                                        <ShoppingCart className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                                        EQUIP_GEAR
                                    </Button>
                                </div>
                            </div>

                            {/* Meta Tech Info */}
                            <div className="mt-8 flex gap-6 text-[10px] text-muted-foreground uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-primary/40 rotate-45" />
                                    SECURE_TRANS_VERIFIED
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-primary/40 rotate-45" />
                                    LOYALTY_XP_READY
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Reviews Section Integration */}
            <section id="reviews" className="bg-black/20 border-t border-white/5 py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-12">
                        {/* Left: Summary & CTA */}
                        <div className="md:w-1/3 space-y-8">
                            <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter">
                                Operator Debriefs
                            </h2>

                            {ratingData && (
                                <ReviewSummary
                                    avgRating={Number(ratingData.avg_rating)}
                                    totalReviews={ratingData.review_count}
                                    distribution={{
                                        five: ratingData.five_star,
                                        four: ratingData.four_star,
                                        three: ratingData.three_star,
                                        two: ratingData.two_star,
                                        one: ratingData.one_star
                                    }}
                                />
                            )}

                            {!user ? (
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
                                    <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Join the Guild</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Login to verify your purchase and leave a review.</p>
                                    <Button onClick={() => navigate('/login')} variant="outline" className="w-full">LOG_IN_TO_REVIEW</Button>
                                </div>
                            ) : !userReviewStatus.hasPurchased ? (
                                <div className="p-6 bg-card border border-white/5 rounded-lg text-center opacity-75">
                                    <h3 className="font-bold text-sm uppercase text-muted-foreground">Verified Operators Only</h3>
                                    <p className="text-xs text-muted-foreground mt-2">Only verified purchasers can submit debriefs.</p>
                                </div>
                            ) : userReviewStatus.hasReviewed ? (
                                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                                    <h3 className="font-bold text-green-500">Debrief Submitted</h3>
                                    <p className="text-xs text-muted-foreground mt-2">Thank you for your intelligence report.</p>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                                    variant="cyber"
                                    className="w-full h-14 text-lg font-bold"
                                >
                                    {isReviewFormOpen ? "CANCEL_DEBRIEF" : "WRITE_DEBRIEF"}
                                </Button>
                            )}
                        </div>

                        {/* Right: List or Form */}
                        <div className="md:w-2/3">
                            <AnimatePresence mode="wait">
                                {isReviewFormOpen ? (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <ReviewForm
                                            productId={id!}
                                            onSuccess={() => { }}
                                            onOptimisticAdd={handleOptimisticAdd}
                                            onOptimisticRemove={handleOptimisticRemove}
                                            onOptimisticReplace={handleOptimisticReplace}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <ReviewsList productId={id!} optimisticReviews={optimisticReviews} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>


            <Footer />
        </div>
    );
}
