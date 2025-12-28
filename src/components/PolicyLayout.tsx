import React from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface PolicyLayoutProps {
    title: string;
    children: React.ReactNode;
}

export function PolicyLayout({ title, children }: PolicyLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter uppercase mb-8 text-primary">
                        {title}
                    </h1>
                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        {children}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
