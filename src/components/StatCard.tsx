import React from 'react';
import clsx from 'clsx';

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    unit?: string;
    icon?: React.ReactNode;
    className?: string;
    dark?: boolean;
    /** Grey the value out (no fresh data). */
    muted?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, unit, icon, className, dark, muted }) => {
    return (
        <div className={clsx(
            "rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300",
            dark ? "bg-[#1C1815] text-white shadow-xl" : "bg-white border border-[#E8E0D5] text-[#2A2118] shadow-sm",
            className
        )}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <span className={clsx("text-xs font-semibold tracking-widest uppercase", dark ? "text-[#E8E0D5]" : "text-[#7A7A52]")}>
                        {label}
                    </span>
                    {subValue && (
                        <span className={clsx("text-xs", dark ? "text-[#E8E0D5]/70" : "text-[#2A2118]/60")}>
                            {subValue}
                        </span>
                    )}
                </div>
                {icon && (
                    <div className={clsx("p-2 rounded-full", dark ? "bg-white/10 text-white" : "bg-black/[0.03] text-[#2A2118]")}>
                        {icon}
                    </div>
                )}
            </div>

            <div className="mt-auto flex items-end gap-1">
                <span className={clsx("font-serif leading-none tracking-tight", typeof value === 'string' && value.length > 5 ? "text-2xl" : "text-5xl", muted && "opacity-40 grayscale")}>
                    {value}
                </span>
                {unit && (
                    <span className={clsx("text-sm font-medium mb-1", dark ? "text-[#E8E0D5]/70" : "text-[#7A7A52]")}>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
};
