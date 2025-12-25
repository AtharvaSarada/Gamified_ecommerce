import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExperienceBarProps {
    level?: number;
    currentXp?: number;
    maxXp?: number;
    className?: string;
    variant?: "compact" | "full";
}

export function ExperienceBar({
    level = 1,
    currentXp = 750,
    maxXp = 1000,
    className,
    variant = "compact",
}: ExperienceBarProps) {
    const progress = (currentXp / maxXp) * 100;

    return (
        <div className={cn("flex flex-col gap-1 w-full max-w-[300px]", className)}>
            <div className="flex justify-between items-end px-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-tighter">
                        Level
                    </span>
                    <span className="text-sm font-display font-black text-primary italic leading-none">
                        {level}
                    </span>
                </div>
                {variant === "full" && (
                    <span className="text-[10px] font-display font-medium text-muted-foreground tabular-nums">
                        {currentXp} / {maxXp} XP
                    </span>
                )}
            </div>

            <div className="relative h-1.5 bg-muted/20 border border-white/5 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_0%,transparent_45%,rgba(255,255,255,0.1)_50%,transparent_55%,transparent_100%)] bg-[length:20px_100%]" />

                {/* Progress Fill */}
                <motion.div
                    className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_rgba(0,255,240,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Animated Glow Tip */}
                    <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white/40 blur-sm"
                        animate={{
                            opacity: [0, 1, 0],
                            x: [0, 5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>

                {/* Diagonal Markers */}
                <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-[1px] h-full bg-white/10 rotate-12" />
                    ))}
                </div>
            </div>

            {/* Valorant-style accent dots */}
            <div className="flex justify-between px-0.5">
                <div className="w-1 h-1 bg-primary/40 rotate-45" />
                <div className="w-1 h-1 bg-primary/40 rotate-45" />
            </div>
        </div>
    );
}
