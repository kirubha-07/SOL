import { createContext } from 'react';
import type { Vitals } from './useVitals';

export const VitalsContext = createContext<Vitals | null>(null);
