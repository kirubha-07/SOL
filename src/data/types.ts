export type SensoryState = 'Calm' | 'Elevated' | 'Escalating';

export interface MLInsight {
    predictedState: SensoryState;
    confidence: number;
    contributingSignals: {
        hrPattern: number;
        movement: number;
        recentTrend: number;
    };
    interpretation: string;
}

export interface SensorData {
    heartRate: number;
    movement: number;
    timestamp: string;
    quality: number;
}

export interface AppEvent {
    id: string;
    time: string;
    state: SensoryState;
    triggerPattern: string;
    action: string;
    outcome: string;
}

export interface DeviceStatus {
    name: string;
    type: string;
    battery: number;
    connected: boolean;
    status: 'active' | 'standby' | 'error';
    lastSync: string;
}

export interface EnvironmentStatus {
    lighting: { active: boolean; mode: string };
    audio: { active: boolean; mode: string };
    wearable: { active: boolean; mode: string };
}
