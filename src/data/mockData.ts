import type { SensoryState, SensorData } from './types';

// DEMO ONLY. Simulated values shown when the app is in Demo mode.
export const mockSensorData: Record<SensoryState, SensorData> = {
    Calm: { heartRate: 72, spo2: 98, motion: 0.05 },
    Elevated: { heartRate: 94, spo2: 97, motion: 0.18 },
    Escalating: { heartRate: 118, spo2: 96, motion: 0.3 },
};
