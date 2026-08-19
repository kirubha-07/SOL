import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Activity, TrendingUp, Clock, Brain, ThermometerSun, Watch, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import { DemoSwitcher } from './DemoSwitcher';

const navItems = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/monitoring', label: 'Live Monitoring', icon: Activity },
    { path: '/trends', label: 'Trends', icon: TrendingUp },
    { path: '/events', label: 'Events', icon: Clock },
    { path: '/insights', label: 'ML Insights', icon: Brain },
    { path: '/environment', label: 'Environment', icon: ThermometerSun },
    { path: '/wearable', label: 'Wearable', icon: Watch },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-white border-r border-[#E8E0D5] h-screen flex-col hidden lg:flex sticky top-0">
            <div className="p-6 pb-2 border-b border-[#E8E0D5]/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[--color-surface-dark] flex items-center justify-center">
                        <Watch className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-serif font-bold text-xl text-[--color-surface-dark]">Antigravity</span>
                </div>
            </div>

            <div className="p-6 border-b border-[#E8E0D5]/50">
                <DemoSwitcher />
            </div>

            <nav className="flex-1 p-4 overflow-y-auto space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm",
                            isActive
                                ? "bg-[--color-surface-dark] text-white shadow-md shadow-black/10"
                                : "text-[--color-text-primary]/70 hover:bg-black/5 hover:text-[--color-text-primary]"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-[#E8E0D5]/50 text-xs text-[--color-text-primary]/50">
                <p>Research Prototype v0.1</p>
                <p className="mt-1">Not for medical diagnosis.</p>
            </div>
        </aside>
    );
};

export const BottomNav: React.FC = () => {
    // Mobile nav shows core routes
    const mobileNav = [
        { path: '/', icon: Home },
        { path: '/monitoring', icon: Activity },
        { path: '/trends', icon: TrendingUp },
        { path: '/events', icon: Clock },
        { path: '/wearable', icon: Watch },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E0D5] pb-safe z-40 px-6 py-4 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            {mobileNav.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => clsx(
                        "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                        isActive
                            ? "bg-[--color-surface-dark] text-white shadow-lg"
                            : "text-[--color-text-primary]/50 hover:bg-black/5"
                    )}
                >
                    <item.icon className="w-5 h-5" />
                </NavLink>
            ))}
        </div>
    );
};
