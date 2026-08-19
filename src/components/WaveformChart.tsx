import React, { useEffect, useState } from 'react';
import { useDemoMode } from '../data/demoContext';
import { generateDotMatrixWaveform } from '../data/mockData';
import { HeartPulse } from 'lucide-react';
import clsx from 'clsx';

export const WaveformChart: React.FC<{ dark?: boolean; height?: number }> = ({ dark = false, height = 120 }) => {
    const { currentState } = useDemoMode();
    const [data, setData] = useState<number[]>(generateDotMatrixWaveform(currentState));

    useEffect(() => {
        const interval = setInterval(() => {
            setData((prev) => {
                const newData = generateDotMatrixWaveform(currentState);
                return [...prev.slice(1), newData[newData.length - 1]];
            });
        }, 300);
        return () => clearInterval(interval);
    }, [currentState]);

    const min = Math.min(...data) - 10;
    const max = Math.max(...data) + 10;
    const width = 300;

    return (
        <div className="w-full relative flex flex-col h-full rounded-2xl overflow-hidden p-6 bg-[#161210]">
            <div className="flex justify-between items-center mb-6 z-10 relative">
                <h3 className={clsx("text-xs font-semibold uppercase tracking-widest", dark ? "text-[#E8E0D5]" : "text-[#7A7A52]")}>
                    PPG Signal
                </h3>
                <HeartPulse className="w-5 h-5 text-[--color-terracotta]" />
            </div>

            <div className="relative flex-1 mt-auto min-h-[100px] z-0" style={{ minHeight: height }}>
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                    {data.map((val, i) => {
                        const x = (i / (data.length - 1)) * width;
                        const y = height - ((val - min) / (max - min)) * height;

                        // Prevent NaN coordinates from breaking the renderer
                        if (isNaN(y)) return null;

                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={1.8}
                                className="transition-all duration-300 ease-linear fill-[#C1633D] shadow-[0_0_10px_rgba(193,99,61,0.5)]"
                                style={{ transformOrigin: 'center' }}
                            />
                        );
                    })}
                </svg>
            </div>
            {/* Added overlay shadow for that inset screen look */}
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none rounded-2xl z-20"></div>
        </div>
    );
};
