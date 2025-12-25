import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
    password?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
    const getStrength = (pass: string) => {
        let score = 0;
        if (pass.length === 0) return 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getStrength(password);

    const labels = ['None', 'Weak', 'Medium', 'Strong', 'Legendary'];
    const colors = [
        'bg-muted',
        'bg-destructive',
        'bg-orange-500',
        'bg-primary',
        'bg-accent animate-pulse'
    ];

    return (
        <div className="space-y-1.5 w-full mt-2">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                <span>SECURITY LEVEL</span>
                <span className={cn(strength > 0 && "text-foreground")}>{labels[strength]}</span>
            </div>
            <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((step) => (
                    <div
                        key={step}
                        className={cn(
                            "flex-1 rounded-full transition-all duration-500",
                            step <= strength ? colors[strength] : "bg-white/10"
                        )}
                    />
                ))}
            </div>
            {password.length > 0 && password.length < 8 && (
                <p className="text-[10px] text-destructive/80 font-medium">MINIMUM 8 CHARACTERS REQUIRED</p>
            )}
        </div>
    );
};
