import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/FormInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Edit2, Camera, ShieldCheck, Trash2 } from 'lucide-react';
import { ProfileSkeleton } from '@/components/ui/Skeletons';
import { ExperienceBar } from '@/components/ExperienceBar';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional().or(z.literal('')),
});

export const ProfileTab: React.FC = () => {
    const { user, profile, loading, deleteAccount } = useAuth();
    const [editing, setEditing] = useState(false);
    const [updating, setUpdating] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: profile?.full_name || '',
            phone: profile?.phone || '',
        }
    });

    const onSubmit = async (data: any) => {
        if (!user) return;
        setUpdating(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: data.fullName,
                phone: data.phone,
                updated_at: new Date().toISOString(),
            } as any)
            .eq('id', user.id);

        if (error) {
            toast.error('Failed to update profile');
        } else {
            toast.success('Profile updated successfully');
            setEditing(false);
        }
        if (error) {
            toast.error('Failed to update profile');
        } else {
            toast.success('Profile updated successfully');
            setEditing(false);
        }
        setUpdating(false);
    };

    if (loading) return <ProfileSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden ring-4 ring-primary/5">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-display font-bold text-primary">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </span>
                        )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-110 transition-transform">
                        <Camera size={18} />
                    </button>
                </div>
                <div className="mt-6 text-center space-y-4 flex flex-col items-center">
                    <div>
                        <h1 className="text-2xl font-display font-bold neon-text">{profile?.full_name}</h1>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest">{user?.email}</p>
                    </div>

                    <ExperienceBar
                        level={profile?.level || 1}
                        currentXp={profile?.xp || 0}
                        maxXp={1000} // This could also be dynamic based on level if we had a formula
                        variant="full"
                        className="mt-2"
                    />
                </div>
            </div>

            <div className="max-w-xl mx-auto border-t border-white/5 pt-8">
                {!editing ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                                <p className="font-medium mt-1">{profile?.full_name || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                                <p className="font-medium mt-1">{profile?.phone || 'Not set'}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5"
                            onClick={() => setEditing(true)}
                        >
                            <Edit2 size={16} className="mr-2" />
                            EDIT PROFILE
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormInput
                            label="Full Name"
                            error={errors.fullName?.message as string}
                            {...register('fullName')}
                        />
                        <FormInput
                            label="Phone Number"
                            error={errors.phone?.message as string}
                            {...register('phone')}
                        />
                        <div className="flex gap-3">
                            <Button type="submit" className="flex-1 font-bold" disabled={updating}>
                                {updating ? 'SAVING...' : 'SAVE CHANGES'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1"
                                onClick={() => setEditing(false)}
                                disabled={updating}
                            >
                                CANCEL
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Security Actions */}
            <div className="max-w-xl mx-auto space-y-4 pt-8">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center text-muted-foreground">
                    <ShieldCheck size={16} className="mr-2" />
                    Security Settings
                </h3>
                <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm">Account Password</p>
                            <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs border-white/10">CHANGE</Button>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                            <p className="font-bold text-sm text-destructive">Deactivate Account</p>
                            <p className="text-xs text-muted-foreground">Permanently delete your data</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                    deleteAccount();
                                }
                            }}
                        >
                            <Trash2 size={14} className="mr-1" />
                            DELETE
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
