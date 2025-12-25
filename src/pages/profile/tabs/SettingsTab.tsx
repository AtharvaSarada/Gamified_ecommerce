import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Shield, Mail, Smartphone, Globe, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsTab: React.FC = () => {
    const { profile } = useAuth();

    const settingsGroups = [
        {
            title: 'Communication',
            icon: Mail,
            items: [
                { id: 'orders', label: 'Order Updates', desc: 'Receive emails about your order status.', default: true },
                { id: 'promo', label: 'Gear Drops', desc: 'Get notified about new collection launches.', default: profile?.promo_notifications },
                { id: 'newsletter', label: 'Guild Newsletter', desc: 'A weekly roundup of gaming streetwear trends.', default: false },
            ]
        },
        {
            title: 'Privacy & Social',
            icon: Shield,
            items: [
                { id: 'public', label: 'Public Profile', desc: 'Allow others to view your mission rank and stats.', default: false },
                { id: 'activity', label: 'Show Activity', desc: 'Display your recent equipment acquisitions.', default: true },
            ]
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-display font-bold tracking-tight">TERMINAL SETTINGS</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your notification protocols and privacy levels.</p>
            </div>

            <div className="space-y-12">
                {settingsGroups.map((group, idx) => (
                    <section key={idx} className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                            <group.icon size={18} className="text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                {group.title}
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {group.items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-4 group">
                                    <div className="space-y-1">
                                        <Label htmlFor={item.id} className="text-sm font-bold tracking-wide group-hover:text-primary transition-colors cursor-pointer">
                                            {item.label}
                                        </Label>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <Switch id={item.id} defaultChecked={item.default as boolean} />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <Globe size={18} className="text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Regional Protocol
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Currency System</Label>
                            <div className="p-3 bg-white/2 border border-white/5 rounded-xl font-bold flex justify-between items-center text-sm">
                                <span>INDIAN RUPEE (INR)</span>
                                <span className="text-primary font-mono font-normal opacity-50">₹</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Language Matrix</Label>
                            <div className="p-3 bg-white/2 border border-white/5 rounded-xl font-bold flex justify-between items-center text-sm">
                                <span>ENGLISH (US)</span>
                                <Globe size={14} className="opacity-50" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left transition-all hover:bg-white/5">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Info size={24} />
                    </div>
                    <div className="space-y-4 flex-1">
                        <div>
                            <h4 className="font-bold text-sm tracking-wide">Developer & Guild Support</h4>
                            <p className="text-xs text-muted-foreground mt-1">Need help with your terminal or gear? Our tech team is on standby 24/7.</p>
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase border-white/10 hover:border-primary/50">
                                KNOWLEDGE BASE
                            </Button>
                            <Button size="sm" variant="ghost" className="text-[10px] font-bold uppercase hover:bg-white/5">
                                CONTACT TECHS
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
