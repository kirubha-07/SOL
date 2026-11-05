import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { SensoryState } from './types';

/** 'live' reads the band through /api/vitals. 'demo' uses simulated data from mockData.ts. */
export type DataMode = 'live' | 'demo';

interface DemoContextType {
    dataMode: DataMode;
    setDataMode: (mode: DataMode) => void;
    /** Only used in demo mode. */
    currentState: SensoryState;
    setCurrentState: (state: SensoryState) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Always start in live mode so demo data is never mistaken for the band.
    const [dataMode, setDataMode] = useState<DataMode>('live');
    const [currentState, setCurrentState] = useState<SensoryState>('Calm');

    return (
        <DemoContext.Provider value={{ dataMode, setDataMode, currentState, setCurrentState }}>
            {children}
        </DemoContext.Provider>
    );
};

export const useDemoMode = () => {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoProvider');
    }
    return context;
};
