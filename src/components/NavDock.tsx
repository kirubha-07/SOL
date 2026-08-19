import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, Clock, User, Home, ActivitySquare, Brain, ThermometerSun, Watch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const NAV_ITEMS = [
    { id: 'overview', path: '/', icon: Home, label: 'Dashboard' },
    { id: 'monitoring', path: '/monitoring', icon: Activity, label: 'Live' },
    { id: 'trends', path: '/trends', icon: ActivitySquare, label: 'Trends' },
    { id: 'events', path: '/events', icon: Clock, label: 'Events' },
    { id: 'insights', path: '/insights', icon: Brain, label: 'Insights' },
    { id: 'environment', path: '/environment', icon: ThermometerSun, label: 'Env.' },
    { id: 'wearable', path: '/wearable', icon: Watch, label: 'Wearable' },
    { id: 'settings', path: '/settings', icon: User, label: 'Profile' },
];

export const NavDock: React.FC = () => {
    const location = useLocation();

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center pointer-events-none w-full">
            {/* The dock uses flex layout dynamically handling the size shift */}
            <div className="w-[95%] sm:w-max max-w-[95%] bg-white/95 backdrop-blur-md rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-[#E8E0D5] p-2 flex items-center overflow-x-auto no-scrollbar pointer-events-auto gap-1">

                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className={clsx(
                                "relative flex flex-col items-center justify-center rounded-full shrink-0 outline-none dock-item transition-all duration-300",
                                isActive ? "w-16 h-16 mx-1 shadow-lg" : "w-10 h-10 mx-0 hover:bg-black/5"
                            )}
                        >
                            {/* Active Solid Black Bubble (Framer Motion handles the smooth sliding animation) */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeNavBubble"
                                    className="absolute inset-0 bg-[#1C1815] rounded-full -z-10"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}

                            <item.icon
                                className={clsx(
                                    "transition-colors duration-300",
                                    isActive ? "w-6 h-6 text-white stroke-[2.5]" : "w-5 h-5 text-[#7A7A52] stroke-[1.5]"
                                )}
                            />

                            {/* Active Label (Only visible on active, positioned exactly per reference) */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                                        transition={{ delay: 0.15 }}
                                        className="absolute -bottom-7 text-[10px] bg-white/90 shadow-sm backdrop-blur-sm pointer-events-none font-bold uppercase tracking-widest text-[#2A2118] px-2.5 py-0.5 rounded-full whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                        </NavLink>
                    );
                })}

            </div>

            {/* Mobile Home Indicator aesthetic bar */}
            <div className="w-16 h-1 mt-8 bg-black/20 rounded-full md:hidden"></div>
        </div>
    );
};
