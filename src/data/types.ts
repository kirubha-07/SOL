export type SensoryState = 'Calm' | 'Elevated' | 'Escalating';

export interface SensorData {
    heartRate: number;
    spo2: number;
    /** Motion magnitude as deviation from 1 g (same unit as the band's V4 datastream). */
    motion: number;
}
