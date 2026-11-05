import React from 'react';
import clsx from 'clsx';
import { useDemoMode } from '../data/demoContext';
import { useVitals } from '../data/useVitals';
import type { SensoryState } from '../data/types';

export const DemoSwitcher: React.FC = () => {
    const { dataMode, setDataMode, currentState, setCurrentState } = useDemoMode();
    const { status } = useVitals();

    return (
        <div className="flex flex-wrap items-center gap-3">
            {dataMode === 'demo' ? (
                <span className="px-3 py-1 rounded-full bg-(--color-elevated) text-[#1C1815] text-xs font-bold uppercase tracking-widest">
                    Demo · simulated data
                </span>
            ) : (
                <span
                    className={clsx(
                        'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border',
                        status === 'live' ? 'border-(--color-calm)/30 bg-(--color-calm)/10 text-(--color-calm)' : 'border-[#E8E0D5] bg-black/5 text-[#7A7A52]'
                    )}
                >
                    {status === 'live' ? 'Live' : 'Disconnected'}
                </span>
            )}

            <div className="flex bg-[#1C1815] rounded-full p-1" role="group" aria-label="Data source">
                {(['live', 'demo'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setDataMode(m)}
                        aria-pressed={dataMode === m}
                        className={clsx(
                            'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors',
                            dataMode === m ? 'bg-[#FAF6F0] text-[#1C1815]' : 'text-[#FAF6F0]/70 hover:text-[#FAF6F0]'
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {dataMode === 'demo' && (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold hidden md:inline">Demo State:</span>
                    <select
                        value={currentState}
                        onChange={(e) => setCurrentState(e.target.value as SensoryState)}
                        className="bg-[#1C1815] text-[#FAF6F0] text-sm py-1 px-3 rounded-full border border-[#2A2118] focus:outline-none focus:ring-2 focus:ring-[#C1633D]"
                    >
                        <option value="Calm">Calm</option>
                        <option value="Elevated">Elevated</option>
                        <option value="Escalating">Escalating</option>
                    </select>
                </div>
            )}
        </div>
    );
};
