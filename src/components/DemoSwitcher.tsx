import React from 'react';
import { useDemoMode } from '../data/demoContext';

export const DemoSwitcher: React.FC = () => {
    const { currentState, setCurrentState } = useDemoMode();

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#7A7A52] font-semibold hidden md:inline">Demo State:</span>
            <select
                value={currentState}
                onChange={(e) => setCurrentState(e.target.value as any)}
                className="bg-[#1C1815] text-[#FAF6F0] text-sm py-1 px-3 rounded-full border border-[#2A2118] focus:outline-none focus:ring-2 focus:ring-[#C1633D]"
            >
                <option value="Calm">Calm</option>
                <option value="Elevated">Elevated</option>
                <option value="Escalating">Escalating</option>
            </select>
        </div>
    );
};
