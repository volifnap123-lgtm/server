import { create } from 'zustand';

export type PowerState = 'GRID' | 'BATTERY' | 'GENERATOR' | 'CAPACITOR' | 'OFF';
export type ViewMode = 'PHYSICAL' | 'XRAY' | 'LAYERED';
export type SectorStatus = 'GREEN' | 'YELLOW' | 'RED' | 'OFFLINE';
export type DrawerState = 'LOCKED' | 'UNLOCKED' | 'OPEN' | 'REMOVED';
export type PacketType = 'CLEAN' | 'MALWARE' | 'ENCRYPTED';

export interface DataPacket {
  id: string;
  type: PacketType;
  progress: number;
  from: string;
  to: string;
  created: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'alert';
  message: string;
}

export interface ServerState {
  power: PowerState;
  batteryLevel: number;
  generatorFuel: number[];
  gridActive: boolean;
  
  viewMode: ViewMode;
  visibleLevels: boolean[];
  
  maintenanceMode: boolean;
  authenticated: boolean;
  
  sectorStatus: SectorStatus[];
  drawerStates: Record<string, DrawerState>;
  lockedDoors: boolean[];
  
  dataPackets: DataPacket[];
  logs: LogEntry[];
  
  pcmTemp: number;
  pumpActive: boolean;
  coolantFlow: number;
  
  alarmActive: boolean;
  lockdown: boolean;

  setPower: (power: PowerState) => void;
  setBatteryLevel: (level: number) => void;
  setGeneratorFuel: (index: number, fuel: number) => void;
  setGridActive: (active: boolean) => void;
  
  setViewMode: (mode: ViewMode) => void;
  toggleLevel: (level: number) => void;
  
  setMaintenanceMode: (enabled: boolean) => void;
  authenticate: () => void;
  
  setSectorStatus: (sector: number, status: SectorStatus) => void;
  setDrawerState: (moduleId: string, state: DrawerState) => void;
  setDoorState: (door: number, locked: boolean) => void;
  
  triggerAttack: (type: PacketType) => void;
  updatePackets: () => void;
  
  addLog: (message: string, level?: 'info' | 'warning' | 'alert') => void;
  
  setPCMtemp: (temp: number) => void;
  setPumpActive: (active: boolean) => void;
  setCoolantFlow: (flow: number) => void;
  
  triggerAlarm: (active: boolean) => void;
  setLockdown: (locked: boolean) => void;
  
  resetSystem: () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  power: 'GRID',
  batteryLevel: 100,
  generatorFuel: [100, 100, 100, 100],
  gridActive: true,
  
  viewMode: 'PHYSICAL',
  visibleLevels: [true, true, true, true, true],
  
  maintenanceMode: false,
  authenticated: false,
  
  sectorStatus: ['GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN'],
  drawerStates: {},
  lockedDoors: [true, true, true, true],
  
  dataPackets: [],
  logs: [],
  
  pcmTemp: 25,
  pumpActive: true,
  coolantFlow: 1,
  
  alarmActive: false,
  lockdown: false,

  setPower: (power) => {
    set({ power });
    get().addLog(`POWER: Source changed to ${power}`, power === 'OFF' ? 'alert' : 'info');
  },
  
  setBatteryLevel: (level) => set({ batteryLevel: Math.max(0, Math.min(100, level)) }),
  setGeneratorFuel: (index, fuelLevel) => {
    set((state) => {
      const fuel = [...state.generatorFuel];
      fuel[index] = Math.max(0, Math.min(100, fuelLevel));
      return { generatorFuel: fuel };
    });
  },
  setGridActive: (active) => {
    set({ gridActive: active });
    if (!active && get().power === 'GRID') {
      get().setPower('BATTERY');
    }
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleLevel: (level) => {
    set((state) => {
      const levels = [...state.visibleLevels];
      levels[level] = !levels[level];
      return { visibleLevels: levels };
    });
  },
  
  setMaintenanceMode: (enabled) => set({ maintenanceMode: enabled }),
  authenticate: () => set({ authenticated: true }),
  
  setSectorStatus: (sector, status) => {
    set((state) => {
      const statuses = [...state.sectorStatus];
      statuses[sector] = status;
      return { sectorStatus: statuses };
    });
  },
  setDrawerState: (moduleId, drawerState) => {
    set((state) => {
      const drawers = { ...state.drawerStates };
      drawers[moduleId] = drawerState;
      return { drawerStates: drawers };
    });
  },
  setDoorState: (door, locked) => {
    set((state) => {
      const doors = [...state.lockedDoors];
      doors[door] = locked;
      return { lockedDoors: doors };
    });
  },
  
  triggerAttack: (type) => {
    const packet: DataPacket = {
      id: `packet_${Date.now()}`,
      type,
      progress: 0,
      from: 'internet',
      to: type === 'MALWARE' ? 'threat_lab' : 'buffer',
      created: Date.now()
    };
    set((state) => ({ dataPackets: [...state.dataPackets, packet] }));
    get().addLog(`ATTACK: ${type} packet injected`, 'alert');
  },
  
  updatePackets: () => {
    set((state) => ({
      dataPackets: state.dataPackets
        .map(p => ({ ...p, progress: p.progress + 0.01 }))
        .filter(p => p.progress < 1)
    }));
  },
  
  addLog: (message, level = 'info') => {
    const log: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      level,
      message
    };
    set((state) => ({ logs: [...state.logs.slice(-99), log] }));
  },
  
  setPCMtemp: (temp) => set({ pcmTemp: temp }),
  setPumpActive: (active) => set({ pumpActive: active }),
  setCoolantFlow: (flow) => set({ coolantFlow: Math.max(0, Math.min(1, flow)) }),
  
  triggerAlarm: (active) => {
    set({ alarmActive: active });
    if (active) {
      get().addLog('ALARM: PHYSICAL BREACH DETECTED!', 'alert');
    }
  },
  setLockdown: (locked) => {
    set({ lockdown: locked, lockedDoors: [locked, locked, locked, locked] });
    get().addLog(locked ? 'SECURITY: Lockdown activated' : 'SECURITY: Lockdown released', locked ? 'alert' : 'warning');
  },
  
  resetSystem: () => set({
    power: 'GRID',
    batteryLevel: 100,
    generatorFuel: [100, 100, 100, 100],
    gridActive: true,
    sectorStatus: ['GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN'],
    drawerStates: {},
    dataPackets: [],
    pcmTemp: 25,
    pumpActive: true,
    coolantFlow: 1,
    alarmActive: false,
    lockdown: false,
    authenticated: false,
    maintenanceMode: false
  })
}));