import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/5", className)}
            {...props}
        />
    );
};

export const ProfileSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center">
            <Skeleton className="w-32 h-32 rounded-full" />
            <Skeleton className="h-8 w-48 mt-6" />
            <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="grid gap-6 max-w-xl mx-auto">
            <div className="space-y-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    </div>
);

export const OrdersSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <Skeleton className="w-16 h-16 rounded-lg" />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </div>
        ))}
    </div>
);

export const AddressesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
        ))}
    </div>
);
