import type { SensoryState, SensorData, MLInsight, AppEvent, EnvironmentStatus, DeviceStatus } from './types';

// Generators for simulated sensor streams (pulse waves, etc.)
export const generateDotMatrixWaveform = (state: SensoryState): number[] => {
    const base = state === 'Calm' ? 60 : state === 'Elevated' ? 85 : 110;
    const variance = state === 'Calm' ? 5 : state === 'Elevated' ? 15 : 25;
    return Array.from({ length: 50 }, () => base + (Math.random() * variance - variance / 2));
};

export const mockMLInsights: Record<SensoryState, MLInsight> = {
    Calm: {
        predictedState: 'Calm',
        confidence: 94,
        contributingSignals: { hrPattern: 20, movement: 10, recentTrend: 15 },
        interpretation: 'Physiological signals are stable with minimal irregular movement detected.',
    },
    Elevated: {
        predictedState: 'Elevated',
        confidence: 82,
        contributingSignals: { hrPattern: 60, movement: 45, recentTrend: 50 },
        interpretation: 'Increased movement combined with a change in physiological signal pattern was detected.',
    },
    Escalating: {
        predictedState: 'Escalating',
        confidence: 89,
        contributingSignals: { hrPattern: 90, movement: 85, recentTrend: 90 },
        interpretation: 'Sustained high-frequency movement and divergent physiological signals indicate an escalating pattern.',
    },
};

export const mockSensorData: Record<SensoryState, SensorData> = {
    Calm: { heartRate: 72, movement: 15, timestamp: new Date().toISOString(), quality: 98 },
    Elevated: { heartRate: 94, movement: 45, timestamp: new Date().toISOString(), quality: 95 },
    Escalating: { heartRate: 118, movement: 85, timestamp: new Date().toISOString(), quality: 88 },
};

export const mockEvents: AppEvent[] = [
    { id: '1', time: '10:15 AM', state: 'Elevated', triggerPattern: 'Hr+Motion Sync', action: 'Dim Lighting', outcome: 'Returned to Calm' },
    { id: '2', time: '01:30 PM', state: 'Escalating', triggerPattern: 'Rapid Motion', action: 'Ambient Audio + Vibrotactile', outcome: 'Ongoing intervention' },
    { id: '3', time: '09:00 AM', state: 'Calm', triggerPattern: 'Baseline', action: 'None', outcome: 'Stable' },
];

export const mockEnvironment: EnvironmentStatus = {
    lighting: { active: true, mode: 'Warm Glow' },
    audio: { active: false, mode: 'Nature Scape' },
    wearable: { active: true, mode: 'Calming Pulse' },
};

export const mockDevices: DeviceStatus[] = [
    { name: 'SAW Band Alpha', type: 'Wearable', battery: 84, connected: true, status: 'active', lastSync: 'Just now' },
    { name: 'MAX30102', type: 'PPG Sensor', battery: 100, connected: true, status: 'active', lastSync: 'Just now' },
    { name: 'MPU6050', type: 'Motion Sensor', battery: 100, connected: true, status: 'active', lastSync: 'Just now' },
    { name: 'ESP32 Core', type: 'Processor', battery: 100, connected: true, status: 'active', lastSync: 'Just now' },
];
