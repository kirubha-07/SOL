import { createContext } from 'react';
import type { SolStateValue } from './useSolState';

export const SolContext = createContext<SolStateValue | null>(null);
