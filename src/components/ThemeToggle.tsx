import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative w-10 h-10 rounded-full"
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === "dark" ? 0 : 1,
                        rotate: theme === "dark" ? 90 : 0,
                        opacity: theme === "dark" ? 0 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <Sun className="h-5 w-5 text-amber-500" />
                </motion.div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === "dark" ? 1 : 0,
                        rotate: theme === "dark" ? 0 : -90,
                        opacity: theme === "dark" ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <Moon className="h-5 w-5 text-primary" />
                </motion.div>
            </div>
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}