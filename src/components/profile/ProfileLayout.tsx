import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, Settings, LogOut, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Orders', href: '/profile/orders', icon: Package },
    { name: 'Addresses', href: '/profile/addresses', icon: MapPin },
    { name: 'Wishlist', href: '/profile/wishlist', icon: Heart },
    { name: 'Settings', href: '/profile/settings', icon: Settings },
];

export const ProfileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signOut, profile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        // Attempt to sign out from Supabase, but don't let it block the UI
        try {
            await signOut();
        } catch (e) {
            console.error("Logout error", e);
        }
        // Force clear any remaining auth tokens in local storage
        localStorage.clear();
        sessionStorage.clear();
        // Force redirect immediately
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-8">
                            <Link to="/" className="flex items-center gap-2 group px-2">
                                <div className="relative">
                                    <Hexagon className="w-8 h-8 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]" />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold text-primary">
                                        LD
                                    </span>
                                </div>
                                <span className="font-display font-bold text-lg tracking-wider">
                                    LOOT DROP
                                </span>
                            </Link>
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-display font-bold text-primary">
                                            {profile?.full_name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-lg truncate w-40">
                                        {profile?.full_name || 'Gamer'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground truncate w-40">
                                        Level {profile?.level || 1} Specialist
                                    </p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        end={item.href === '/profile'}
                                        className={({ isActive }) => cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                            isActive
                                                ? "text-primary bg-primary/10 border-l-2 border-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
                                        <span className="font-medium tracking-wide">{item.name}</span>
                                    </NavLink>
                                ))}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300 group mt-4"
                                >
                                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-medium tracking-wide">Logout</span>
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-2xl p-6 md:p-8 min-h-[600px]"
                        >
                            {children}
                        </motion.div>
                    </main>

                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-white/5 flex justify-around items-center p-3">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/profile'}
                        className={({ isActive }) => cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

        </div>
    );
};
