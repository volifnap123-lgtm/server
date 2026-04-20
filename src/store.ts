import { create } from 'zustand';
import serverConfig from './serverConfig.json';

export type PowerState = 'MAIN' | 'BATTERY' | 'CAPACITOR' | 'OFF';
export type RelayStatus = 'CLOSED' | 'OPEN';
export type PacketType = 'CLEAN' | 'MALWARE' | 'ENCRYPTED';

export interface DataPacket {
  id: string;
  type: PacketType;
  pathProgress: number;
  sourceLevel: number;
  targetLevel: number;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: number;
}

interface ServerStore {
  serverConfig: typeof serverConfig;
  powerState: PowerState;
  relayStatus: RelayStatus;
  dataPackets: DataPacket[];
  logs: LogEntry[];
  level1Power: boolean;
  capacitorEnergy: number;

  setPowerState: (state: PowerState) => void;
  setRelayStatus: (status: RelayStatus) => void;
  triggerAttack: () => void;
  cutPower: () => void;
  drainBattery: () => void;
  restoreRelay: () => void;
  updateConfig: (newConfig: Partial<typeof serverConfig>) => void;
  addLog: (message: string) => void;
  updatePackets: () => void;
  clearPackets: () => void;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  serverConfig,
  powerState: 'MAIN',
  relayStatus: 'CLOSED',
  dataPackets: [],
  logs: [],
  level1Power: true,
  capacitorEnergy: 100,

  setPowerState: (state) => {
    set({ powerState: state });
    get().addLog(`POWER: Switched to ${state}`);
  },

  setRelayStatus: (status) => {
    set({ 
      relayStatus: status,
      level1Power: status === 'CLOSED'
    });
    get().addLog(`RELAY: Status changed to ${status}`);
  },

  triggerAttack: () => {
    const packet: DataPacket = {
      id: `packet_${Date.now()}`,
      type: 'MALWARE',
      pathProgress: 0,
      sourceLevel: 4,
      targetLevel: 1,
      createdAt: Date.now()
    };

    set((state) => ({
      dataPackets: [...state.dataPackets, packet]
    }));

    get().addLog('SECURITY: MALWARE INJECTED - Traversing network...');
  },

  cutPower: () => {
    const state = get();
    if (state.powerState === 'MAIN') {
      state.setPowerState('BATTERY');
      get().addLog('POWER: Main lost - Switched to BATTERY');
    } else if (state.powerState === 'BATTERY') {
      state.setPowerState('OFF');
      get().addLog('POWER: BATTERY DRAINED - System OFF');
    }
  },

  drainBattery: () => {
    set((state) => {
      if (state.powerState === 'BATTERY') {
        return {
          powerState: 'OFF',
          capacitorEnergy: 100
        };
      }
      return {};
    });
    get().addLog('POWER: BATTERY DRAINED - CAPACITORS ACTIVE');
  },

  restoreRelay: () => {
    set({ relayStatus: 'CLOSED', level1Power: true });
    get().addLog('RELAY: RESTORED - Power to Level 1 restored');
  },

  updateConfig: (newConfig) => {
    set((state) => ({
      serverConfig: { ...state.serverConfig, ...newConfig }
    }));
  },

  addLog: (message) => {
    const log: LogEntry = {
      id: `log_${Date.now()}`,
      message,
      timestamp: Date.now()
    };
    set((state) => ({
      logs: [...state.logs.slice(-49), log]
    }));
  },

  updatePackets: () => {
    set((state) => ({
      dataPackets: state.dataPackets.map(p => ({
        ...p,
        pathProgress: Math.min(p.pathProgress + 0.01, 1)
      })).filter(p => p.pathProgress < 1)
    }));
  },

  clearPackets: () => {
    set({ dataPackets: [] });
  }
}));