import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { SensoryState } from './types';

interface DemoContextType {
    currentState: SensoryState;
    setCurrentState: (state: SensoryState) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentState, setCurrentState] = useState<SensoryState>('Calm');

    return (
        <DemoContext.Provider value={{ currentState, setCurrentState }}>
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
