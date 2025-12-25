import { motion } from "framer-motion";
import { ChevronRight, Shirt, Package } from "lucide-react";

const categories = [
  {
    id: "regular",
    title: "REGULAR FIT",
    subtitle: "Standard Issue",
    description: "Classic cuts for everyday missions. Comfortable, versatile, and ready for action.",
    icon: Shirt,
    color: "primary",
    stats: { items: 24, soldOut: 8 },
  },
  {
    id: "oversized",
    title: "OVERSIZED",
    subtitle: "Heavy Armor",
    description: "Bold silhouettes for maximum impact. Make a statement with every appearance.",
    icon: Package,
    color: "secondary",
    stats: { items: 18, soldOut: 12 },
  },
];

export function CategorySection() {
  return (
    <section id="collection" className="py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            CHOOSE YOUR <span className="text-secondary neon-text-pink">LOADOUT</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select your preferred armor type and equip the perfect fit for your style.
          </p>
        </motion.div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <motion.a
              key={category.id}
              href={`#${category.id}`}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group relative"
            >
              <div className={`
                relative bg-card border-2 p-8 transition-all duration-500
                angular-card overflow-hidden
                ${category.color === 'primary' 
                  ? 'border-primary/30 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]' 
                  : 'border-secondary/30 hover:border-secondary hover:shadow-[0_0_30px_hsl(var(--secondary)/0.3)]'
                }
              `}>
                {/* Background Glow */}
                <div className={`
                  absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl
                  ${category.color === 'primary' ? 'bg-primary/20' : 'bg-secondary/20'}
                `} />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 mb-6 flex items-center justify-center rounded border-2
                    ${category.color === 'primary' 
                      ? 'border-primary/50 bg-primary/10' 
                      : 'border-secondary/50 bg-secondary/10'
                    }
                  `}>
                    <category.icon className={`w-8 h-8 ${category.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>

                  {/* Title */}
                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground tracking-wider">
                      {category.subtitle}
                    </span>
                  </div>
                  <h3 className="text-3xl font-display font-bold mb-4">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {category.description}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-6 mb-6">
                    <div>
                      <span className={`text-2xl font-display font-bold ${category.color === 'primary' ? 'text-primary' : 'text-secondary'}`}>
                        {category.stats.items}
                      </span>
                      <span className="text-xs text-muted-foreground block">ITEMS</span>
                    </div>
                    <div>
                      <span className="text-2xl font-display font-bold text-accent">
                        {category.stats.soldOut}
                      </span>
                      <span className="text-xs text-muted-foreground block">SOLD OUT</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 font-display text-sm tracking-wider group-hover:gap-4 transition-all">
                    <span className={category.color === 'primary' ? 'text-primary' : 'text-secondary'}>
                      EXPLORE
                    </span>
                    <ChevronRight className={`w-4 h-4 ${category.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                </div>

                {/* Corner Accents */}
                <div className={`absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 opacity-30 ${category.color === 'primary' ? 'border-primary' : 'border-secondary'}`} />
                <div className={`absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 opacity-30 ${category.color === 'primary' ? 'border-primary' : 'border-secondary'}`} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
