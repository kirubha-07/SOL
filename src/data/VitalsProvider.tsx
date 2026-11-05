import React from 'react';
import { useDemoMode } from './demoContext';
import { useVitalsSource } from './useVitals';
import { VitalsContext } from './vitalsContext';

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { dataMode, currentState } = useDemoMode();
    const vitals = useVitalsSource(dataMode, currentState);
    return <VitalsContext.Provider value={vitals}>{children}</VitalsContext.Provider>;
};
