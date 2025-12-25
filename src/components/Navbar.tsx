import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, Hexagon, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ExperienceBar } from "./ExperienceBar";
import { CartSidebar } from "./CartSidebar";

const navLinks = [
  { name: "DROPS", href: "/#drops" },
  { name: "COLLECTION", href: "/#collection" },
  { name: "ABOUT", href: "/#about" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Hexagon className="w-8 h-8 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold text-primary">
                LD
              </span>
            </div>
            <span className="font-display font-bold text-lg tracking-wider hidden sm:block">
              LOOT DROP
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/10 transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                {profile?.is_admin && (
                  <Button variant="ghost" size="icon" asChild className="hidden sm:flex text-primary">
                    <Link to="/admin">
                      <Shield className="w-5 h-5" />
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                  <Link to="/profile">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden sm:flex">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button variant="cyber" size="sm" asChild className="hidden sm:flex">
                <Link to="/login">SIGN IN</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Experience Bar (Full width bottom of navbar) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/10 overflow-hidden">
        <ExperienceBar variant="compact" className="absolute bottom-0 left-0 right-0 max-w-none gap-0" />
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border/50"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-display text-lg tracking-wider text-muted-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-border/50 my-2" />
              {user ? (
                <>
                  {profile?.is_admin && (
                    <Link
                      to="/admin"
                      className="font-display text-lg tracking-wider text-primary hover:text-primary/80 transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      ADMIN PANEL
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="font-display text-lg tracking-wider text-muted-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    PROFILE
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="font-display text-lg tracking-wider text-destructive hover:text-destructive/80 transition-colors py-2 text-left"
                  >
                    SIGN OUT
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="font-display text-lg tracking-wider text-primary hover:text-primary/80 transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  SIGN IN
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
