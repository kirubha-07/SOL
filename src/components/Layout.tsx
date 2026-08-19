import React from 'react';
import { NavDock } from './NavDock';
import { DemoSwitcher } from './DemoSwitcher';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-[--color-off-white] relative pt-6 lg:pt-10">
            <header className="px-6 lg:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-30 pb-4">
                <div className="font-serif font-bold text-2xl text-[--color-surface-dark] tracking-wide">SOL</div>
                <DemoSwitcher />
            </header>

            <main className="flex-1 w-full px-4 lg:px-12 pb-36 lg:pb-32 overflow-x-hidden pt-4 lg:pt-8 transition-all">
                {children}
            </main>

            <NavDock />
        </div>
    );
};
