import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useWishlist } from "@/hooks/useWishlist";
import { Link } from "react-router-dom";

export type Rarity = "common" | "epic" | "legendary";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  discountPercentage?: number;
  images: string[];
  rarity: Rarity;
  stock: number;
  fit: "regular" | "oversized";
}

const rarityConfig = {
  common: {
    label: "COMMON",
    borderClass: "border-border/50 hover:border-muted-foreground/50",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(150,150,150,0.2)]",
    badgeClass: "bg-muted text-muted-foreground border-border",
    animation: "",
  },
  epic: {
    label: "EPIC",
    borderClass: "border-rarity-epic/50 hover:border-rarity-epic",
    glowClass: "group-hover:shadow-[0_0_20px_hsl(var(--rarity-epic)/0.4)]",
    badgeClass: "bg-rarity-epic/20 text-rarity-epic border-rarity-epic/50",
    animation: "animate-pulse",
  },
  legendary: {
    label: "LEGENDARY",
    borderClass: "border-rarity-legendary/50 hover:border-rarity-legendary",
    glowClass: "group-hover:shadow-[0_0_25px_hsl(var(--rarity-legendary)/0.4)]",
    badgeClass: "bg-rarity-legendary/20 text-rarity-legendary border-rarity-legendary/50",
    animation: "animate-glow-pulse",
  },
};

export function ProductCard({
  id,
  name,
  price,
  discountPercentage,
  images,
  rarity,
  stock,
  fit,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Cycle images on hover
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000); // Shuffle every 1 second
    } else {
      setCurrentImageIndex(0); // Reset to main image when not hovered
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  // Safety guards for missing/invalid data
  const safeRarity = rarity && rarityConfig[rarity] ? rarity : "common";
  const config = rarityConfig[safeRarity];
  const safeFit = fit ? fit.toUpperCase() : "REGULAR";
  const isWishlisted = isInWishlist(id);
  const displayImage = images && images.length > 0 ? images[currentImageIndex] : "";

  return (
    <motion.div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Link to={`/product/${id}`}>
        <motion.div
          className={cn(
            "relative bg-card border-2 angular-card overflow-hidden transition-all duration-300",
            config.borderClass,
            config.glowClass
          )}
          style={{
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateX: isHovered ? -5 : 0,
            rotateY: isHovered ? 5 : 0,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Image Container */}
          <div className="relative aspect-[3/4] bg-muted/30 overflow-hidden">
            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(id);
              }}
              className={cn(
                "absolute top-3 left-3 z-30 p-2 rounded-full backdrop-blur-md transition-all duration-300",
                isWishlisted
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,240,0.5)]"
                  : "bg-background/80 text-muted-foreground hover:text-primary hover:bg-background"
              )}
            >
              <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} className={cn(isWishlisted && "animate-pulse")} />
            </button>

            {/* Product Image with Fade Transition */}
            <AnimatePresence mode="wait">
              <motion.img
                key={displayImage}
                src={displayImage}
                alt={name}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </AnimatePresence>

            {/* Scan Line Effect on Hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none"
              initial={{ y: "-100%" }}
              animate={{ y: isHovered ? "100%" : "-100%" }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
            />

            {/* Rarity Badge */}
            <div
              className={cn(
                "absolute top-3 right-3 px-2 py-1 border rounded-sm text-xs font-display tracking-wider z-20",
                config.badgeClass,
                config.animation
              )}
            >
              {config.label}
            </div>

            {/* Fit Badge */}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-background/80 border border-border rounded-sm text-[10px] font-display tracking-wider text-muted-foreground z-20">
              {safeFit}
            </div>

            {/* Quick Actions */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-3 flex gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.2 }}
            >
              <Button variant="cyber" size="sm" className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-1" />
                ADD
              </Button>
              <Button variant="outline" size="icon" className="shrink-0">
                <Eye className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display font-semibold text-lg tracking-wide mb-2 truncate">
              {name}
            </h3>
            <div className="flex items-center justify-between">
              <PriceDisplay
                basePrice={price}
                discountPercentage={discountPercentage}
                size="md"
                showBadge={false}
              />
              <span className={cn(
                "text-[10px] font-display font-bold track-widest px-2 py-0.5 rounded-sm border",
                stock > 0
                  ? "text-primary border-primary/30 bg-primary/5"
                  : "text-destructive border-destructive/30 bg-destructive/5"
              )}>
                {stock > 0 ? "DROP READY" : "DROP LOOTED"}
              </span>
            </div>

            {/* Image Dots Indicator (Only if multiple images) */}
            {isHovered && images.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-1 h-1 rounded-full transition-colors",
                      idx === currentImageIndex ? "bg-primary" : "bg-primary/20"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Corner Accent */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/30" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
