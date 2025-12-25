import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap } from "lucide-react";
import cyberPhantomTee from "@/assets/cyber-phantom-tee.png";

const glitchText = "NEW DROP";

export function HeroSection() {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 scanlines">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-dark">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/50 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, Math.random() * -200 - 100],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "loop",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-sm mb-6"
            >
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-display text-sm tracking-wider text-accent">
                LIMITED EDITION
              </span>
            </motion.div>

            {/* Glitch Title */}
            <div className="relative mb-4">
              <motion.h1
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold glitch neon-text"
                data-text={glitchText}
                initial={{ opacity: 0 }}
                animate={{ opacity: isRevealed ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {glitchText}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Equip legendary streetwear. <br />
              <span className="text-primary">Level up your style.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button variant="cyber" size="xl" className="group">
                CLAIM NOW
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="xl">
                VIEW COLLECTION
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex gap-8 mt-12 justify-center lg:justify-start"
            >
              {[
                { label: "DROPS", value: "50+" },
                { label: "AGENTS", value: "10K+" },
                { label: "SOLD OUT", value: "85%" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Product Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex items-center justify-center"
          >
            {/* Hexagonal Frame */}
            <div className="relative">
              {/* Outer Glow Ring */}
              <motion.div
                className="absolute -inset-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Product Card */}
              <motion.div
                className="relative w-72 h-96 md:w-80 md:h-[28rem] bg-card border border-border/50 angular-card overflow-hidden"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Gradient Border Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
                
                {/* Product Image */}
                <div className="absolute inset-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src={cyberPhantomTee} 
                    alt="Cyber Phantom Tee" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Rarity Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-secondary/20 border border-secondary/50 rounded-sm">
                  <span className="font-display text-xs tracking-wider text-secondary">EPIC</span>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="font-display text-2xl text-foreground">$49.99</span>
                  <span className="text-xs text-muted-foreground">23 LEFT</span>
                </div>
              </motion.div>

              {/* Floating Hexagons */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-8 h-8 border border-primary/30 hex-clip"
                  style={{
                    top: `${20 + i * 30}%`,
                    left: i % 2 === 0 ? '-20%' : '110%',
                  }}
                  animate={{
                    rotate: [0, 360],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 10 + i * 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center pt-2">
          <motion.div
            className="w-1 h-2 bg-primary rounded-full"
            animate={{ opacity: [1, 0], y: [0, 10] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
