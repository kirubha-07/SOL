import React, { useEffect, useState } from 'react';
import { useDemoMode } from '../data/demoContext';
import { generateDotMatrixWaveform } from '../data/mockData';
import { HeartPulse } from 'lucide-react';
import clsx from 'clsx';

export const WaveformChart: React.FC<{ dark?: boolean; height?: number }> = ({ dark = false, height = 120 }) => {
    const { currentState } = useDemoMode();
    const [data, setData] = useState<number[]>([]);

    // Update waveform continuously based on state
    useEffect(() => {
        setData(generateDotMatrixWaveform(currentState));
        const interval = setInterval(() => {
            setData((prev) => {
                const newData = generateDotMatrixWaveform(currentState);
                return [...prev.slice(1), newData[newData.length - 1]];
            });
        }, 500);
        return () => clearInterval(interval);
    }, [currentState]);

    const min = Math.min(...data) - 10;
    const max = Math.max(...data) + 10;

    const width = 300;

    return (
        <div className="w-full relative flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className={clsx("text-xs font-semibold uppercase tracking-widest", dark ? "text-[#E8E0D5]" : "text-[#7A7A52]")}>
                    PPG Signal
                </h3>
                <HeartPulse className={clsx("w-5 h-5", dark ? "text-[--color-terracotta]" : "text-[--color-terracotta]")} />
            </div>

            <div className="relative flex-1 opacity-80 mt-auto min-h-[100px]" style={{ minHeight: height }}>
                <svg fill="none" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                    {data.map((val, i) => {
                        const x = (i / (data.length - 1)) * width;
                        const y = height - ((val - min) / (max - min)) * height;

                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y || height / 2}
                                r={1.5}
                                className={clsx(
                                    "transition-all duration-300 ease-linear origin-center",
                                    dark ? "fill-[--color-terracotta]" : "fill-[--color-terracotta]"
                                )}
                            />
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
