import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Gift, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const perks = [
  { icon: Zap, text: "Early access to drops" },
  { icon: Gift, text: "Exclusive discount codes" },
  { icon: Users, text: "Join 10K+ squad members" },
];

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setEmail("");
    
    toast({
      title: "Welcome to the squad!",
      description: "You've successfully joined our newsletter.",
    });
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 mx-auto mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-card border-2 border-primary/50 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            JOIN THE <span className="text-primary neon-text">SQUAD</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Be the first to know about exclusive drops, get early access, and unlock special rewards.
          </p>

          {/* Perks */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {perks.map((perk, index) => (
              <motion.div
                key={perk.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded"
              >
                <perk.icon className="w-4 h-4 text-primary" />
                <span className="text-sm">{perk.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <div className="flex-1 relative">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-card border-border focus:border-primary pl-4 pr-4 font-body"
                required
              />
            </div>
            <Button
              type="submit"
              variant="cyber"
              size="lg"
              disabled={isLoading}
              className="h-12"
            >
              {isLoading ? (
                "JOINING..."
              ) : (
                <>
                  ENLIST
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.form>

          {/* Privacy Note */}
          <p className="text-xs text-muted-foreground mt-4">
            By joining, you agree to receive marketing emails. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
