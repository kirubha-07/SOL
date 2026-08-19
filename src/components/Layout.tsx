import React from 'react';
import { Sidebar, BottomNav } from './Navigation';
import { DemoSwitcher } from './DemoSwitcher';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex bg-[--color-off-white]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen pb-24 lg:pb-0 relative max-w-[1600px] mx-auto">
                <header className="lg:hidden p-6 flex justify-between items-center sticky top-0 bg-[--color-off-white]/80 backdrop-blur-md z-30">
                    <div className="font-serif font-bold text-xl text-[--color-surface-dark]">Antigravity</div>
                    <DemoSwitcher />
                </header>
                <main className="flex-1 p-6 lg:p-10 lg:pt-10 overflow-x-hidden">
                    {children}
                </main>
            </div>
            <BottomNav />
        </div>
    );
};
