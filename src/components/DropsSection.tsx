import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProductCard, Rarity } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase, directFetchProducts } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rarity: Rarity;
  stock: number;
  fit: "regular" | "oversized";
}

// Fetch products logic
const fetchDrops = async (): Promise<Product[]> => {
  try {
    const data = await directFetchProducts("select=id,name,base_price,rarity,category,images,product_variants(stock_quantity)&is_active=eq.true&deleted_at=is.null");

    return (data || []).map((p: any) => {
      const totalStock = p.product_variants?.reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0) || 0;
      return {
        id: p.id,
        name: p.name,
        price: p.base_price,
        image: p.images?.[0] || "",
        rarity: p.rarity as Rarity,
        stock: totalStock,
        fit: p.category as "regular" | "oversized",
      };
    });
  } catch (err) {
    console.error("fetchDrops failure:", err);
    throw err;
  }
};

type FilterType = "all" | "regular" | "oversized";

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-4">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="text-center">
          <div className="w-16 h-16 bg-card border border-primary/30 rounded flex items-center justify-center">
            <span className="font-display text-2xl text-primary">
              {String(value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground uppercase mt-1 block">
            {key}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DropsSection() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const dropEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["drops"],
    queryFn: fetchDrops,
  });

  const filteredProducts = products?.filter((product) => {
    if (filter === "all") return true;
    return product.fit === filter;
  }) || [];

  return (
    <section id="drops" className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-sm mb-4">
            <Flame className="w-4 h-4 text-accent" />
            <span className="font-display text-sm tracking-wider text-accent">
              HOT DROP
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            LATEST <span className="text-primary neon-text">DROPS</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Exclusive limited-edition gear. Once they're gone, they're gone forever.
          </p>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-accent" />
            <span className="font-display text-sm tracking-wider text-accent">
              DROP ENDS IN
            </span>
          </div>
          <CountdownTimer targetDate={dropEndDate} />
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex bg-card border border-border rounded p-1">
            {(["all", "regular", "oversized"] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-6 py-2 font-display text-sm tracking-wider transition-all duration-300 rounded-sm",
                  filter === type
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="min-h-[400px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive">
              Error loading drops. Please check your connection.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="outline" size="lg" onClick={() => navigate("/shop")}>
            VIEW ALL DROPS
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
