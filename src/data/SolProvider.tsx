import React from 'react';
import { useDemoMode } from './demoContext';
import { useVitals } from './useVitals';
import { useSolSource } from './useSolState';
import { SolContext } from './solContext';

export const SolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { dataMode, currentState } = useDemoMode();
    const vitals = useVitals();
    const sol = useSolSource(dataMode, currentState, vitals);
    return <SolContext.Provider value={sol}>{children}</SolContext.Provider>;
};
