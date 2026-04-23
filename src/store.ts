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

export interface ModuleSpec {
  id: string;
  name: string;
  nameRu: string;
  status: 'active' | 'idle' | 'warning' | 'error';
  temp: number;
  voltage: number;
  drawerState: DrawerState;
}

export interface ServerState {
  power: PowerState;
  batteryLevel: number;
  generatorFuel: number[];
  gridActive: boolean;
  gridVoltage: number;
  
  viewMode: ViewMode;
  visibleLevels: boolean[];
  
  maintenanceMode: boolean;
  authenticated: boolean;
  
  sectorStatus: SectorStatus[];
  drawerStates: Record<string, DrawerState>;
  lockedDoors: boolean[];
  unlockedDoorPassword: string;
  
  dataPackets: DataPacket[];
  logs: LogEntry[];
  
  pcmTemp: number;
  pumpActive: boolean;
  coolantFlow: number;
  ambientTemp: number;
  
  alarmActive: boolean;
  lockdown: boolean;
  
  selectedModule: string | null;
  moduleSpecs: Record<string, ModuleSpec>;

  setPower: (power: PowerState) => void;
  setBatteryLevel: (level: number) => void;
  setGeneratorFuel: (index: number, fuel: number) => void;
  setGridActive: (active: boolean) => void;
  setGridVoltage: (v: number) => void;
  
  setViewMode: (mode: ViewMode) => void;
  toggleLevel: (level: number) => void;
  
  setMaintenanceMode: (enabled: boolean) => void;
  authenticate: (password: string) => boolean;
  logout: () => void;
  
  setSectorStatus: (sector: number, status: SectorStatus) => void;
  setDrawerState: (moduleId: string, state: DrawerState) => void;
  setDoorState: (door: number, locked: boolean) => void;
  unlockDoor: (door: number, password: string) => boolean;
  
  triggerAttack: (type: PacketType) => void;
  updatePackets: () => void;
  
  addLog: (message: string, level?: 'info' | 'warning' | 'alert') => void;
  
  setPCMtemp: (temp: number) => void;
  setPumpActive: (active: boolean) => void;
  setCoolantFlow: (flow: number) => void;
  setAmbientTemp: (temp: number) => void;
  
  triggerAlarm: (active: boolean) => void;
  setLockdown: (locked: boolean) => void;
  
  selectModule: (moduleId: string | null) => void;
  updateModuleSpec: (moduleId: string, spec: Partial<ModuleSpec>) => void;
  
  resetSystem: () => void;
}

const initialModuleSpecs: Record<string, ModuleSpec> = {
  'battery': { id: 'battery', name: 'LiFePO4 Battery', nameRu: 'LiFePO4 Батарея', status: 'active', temp: 25, voltage: 48, drawerState: 'LOCKED' },
  'generator-0': { id: 'generator-0', name: 'H2 Generator #1', nameRu: 'Водородный Генератор #1', status: 'idle', temp: 45, voltage: 12, drawerState: 'LOCKED' },
  'generator-1': { id: 'generator-1', name: 'H2 Generator #2', nameRu: 'Водородный Генератор #2', status: 'idle', temp: 45, voltage: 12, drawerState: 'LOCKED' },
  'generator-2': { id: 'generator-2', name: 'H2 Generator #3', nameRu: 'Водородный Генератор #3', status: 'idle', temp: 45, voltage: 12, drawerState: 'LOCKED' },
  'generator-3': { id: 'generator-3', name: 'H2 Generator #4', nameRu: 'Водородный Генератор #4', status: 'idle', temp: 45, voltage: 12, drawerState: 'LOCKED' },
  'ats': { id: 'ats', name: 'ATS Switch', nameRu: 'ATS Переключатель', status: 'active', temp: 35, voltage: 48, drawerState: 'LOCKED' },
  'pdu': { id: 'pdu', name: 'Smart PDU', nameRu: 'Умный PDU', status: 'active', temp: 40, voltage: 48, drawerState: 'LOCKED' },
  'climate': { id: 'climate', name: 'Climate Control', nameRu: 'Климат-Контроль', status: 'active', temp: 30, voltage: 5, drawerState: 'LOCKED' },
  'resource': { id: 'resource', name: 'Resource Arbiter', nameRu: 'Арбитр Ресурсов', status: 'active', temp: 38, voltage: 3.3, drawerState: 'LOCKED' },
  'admin': { id: 'admin', name: 'Admin Terminal', nameRu: 'Терминал Админа', status: 'idle', temp: 25, voltage: 0, drawerState: 'LOCKED' },
  'capacitor': { id: 'capacitor', name: 'Super Capacitor', nameRu: 'Суперконденсатор', status: 'idle', temp: 28, voltage: 12, drawerState: 'LOCKED' },
  'buffer': { id: 'buffer', name: 'Unified Buffer', nameRu: 'Унифицированный Буфер', status: 'active', temp: 42, voltage: 3.3, drawerState: 'LOCKED' },
  'policy': { id: 'policy', name: 'Policy Engine', nameRu: 'Политика Engine', status: 'active', temp: 48, voltage: 3.3, drawerState: 'LOCKED' },
  'container': { id: 'container', name: 'Container Factory', nameRu: 'Контейнер Фабрика', status: 'active', temp: 52, voltage: 3.3, drawerState: 'LOCKED' },
  'transport-in': { id: 'transport-in', name: 'Optical RX', nameRu: 'Оптический Приёмник', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
  'transport-out': { id: 'transport-out', name: 'Optical TX', nameRu: 'Оптический Передатчик', status: 'active', temp: 35, voltage: 3.3, drawerState: 'LOCKED' },
  'relay': { id: 'relay', name: 'Master Relay', nameRu: 'Главное Реле', status: 'active', temp: 38, voltage: 5, drawerState: 'OPEN' },
  'diagnostics': { id: 'diagnostics', name: 'Diagnostics', nameRu: 'Диагностика', status: 'active', temp: 42, voltage: 5, drawerState: 'LOCKED' },
  'aggregator': { id: 'aggregator', name: 'Aggregator', nameRu: 'Агрегатор', status: 'active', temp: 45, voltage: 3.3, drawerState: 'LOCKED' },
  'heartbeat': { id: 'heartbeat', name: 'Heartbeat Monitor', nameRu: 'Монитор Сердцебиения', status: 'active', temp: 36, voltage: 5, drawerState: 'LOCKED' },
  'data-0': { id: 'data-0', name: 'Input Gateway', nameRu: 'Входной Шлюз', status: 'active', temp: 38, voltage: 3.3, drawerState: 'LOCKED' },
  'data-1': { id: 'data-1', name: 'Threat Lab', nameRu: 'Лаборатория Угроз', status: 'active', temp: 55, voltage: 3.3, drawerState: 'LOCKED' },
  'data-2': { id: 'data-2', name: 'Clean Zone', nameRu: 'Чистая Зона', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
  'data-3': { id: 'data-3', name: 'Outbound Ctrl', nameRu: 'Контроль Исходящих', status: 'active', temp: 36, voltage: 3.3, drawerState: 'LOCKED' },
  'audit-l0': { id: 'audit-l0', name: 'Audit L0', nameRu: 'Аудит L0', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
  'audit-l1': { id: 'audit-l1', name: 'Audit L1', nameRu: 'Аудит L1', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
  'audit-l2': { id: 'audit-l2', name: 'Audit L2', nameRu: 'Аудит L2', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
  'audit-l3': { id: 'audit-l3', name: 'Audit L3', nameRu: 'Аудит L3', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
  'audit-l4': { id: 'audit-l4', name: 'Audit L4', nameRu: 'Аудит L4', status: 'active', temp: 32, voltage: 3.3, drawerState: 'LOCKED' },
};

export const useServerStore = create<ServerState>((set, get) => ({
  power: 'GRID',
  batteryLevel: 100,
  generatorFuel: [100, 100, 100, 100],
  gridActive: true,
  gridVoltage: 230,
  
  viewMode: 'PHYSICAL',
  visibleLevels: [true, true, true, true, true],
  
  maintenanceMode: false,
  authenticated: false,
  
  sectorStatus: ['GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN'],
  drawerStates: {},
  lockedDoors: [true, true, true, true],
  unlockedDoorPassword: 'admin123',
  
  dataPackets: [],
  logs: [],
  
  pcmTemp: 25,
  pumpActive: true,
  coolantFlow: 1,
  ambientTemp: 22,
  
  alarmActive: false,
  lockdown: false,
  
  selectedModule: null,
  moduleSpecs: initialModuleSpecs,

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
      get().addLog('POWER: Grid lost - switched to battery', 'warning');
    }
  },
  setGridVoltage: (v) => set({ gridVoltage: v }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleLevel: (level) => {
    set((state) => {
      const levels = [...state.visibleLevels];
      levels[level] = !levels[level];
      return { visibleLevels: levels };
    });
  },
  
  setMaintenanceMode: (enabled) => set({ maintenanceMode: enabled }),
  authenticate: (password) => {
    if (password === 'admin123') {
      set({ authenticated: true, maintenanceMode: true });
      get().addLog('ACCESS: Admin authenticated', 'info');
      return true;
    }
    get().addLog('ACCESS DENIED: Invalid password', 'warning');
    return false;
  },
  logout: () => {
    set({ authenticated: false, maintenanceMode: false, drawerStates: {} });
    get().addLog('ACCESS: Logged out', 'info');
  },
  
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
  unlockDoor: (door, password) => {
    if (password === get().unlockedDoorPassword) {
      get().setDoorState(door, false);
      get().addLog(`DOOR ${door + 1} unlocked`, 'info');
      return true;
    }
    get().addLog(`DOOR ${door + 1}: Wrong password`, 'warning');
    return false;
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
        .map(p => ({ ...p, progress: p.progress + 0.006 }))
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
  setAmbientTemp: (temp) => set({ ambientTemp: temp }),
  
  triggerAlarm: (active) => {
    set({ alarmActive: active });
    if (active) {
      get().addLog('ALARM: PHYSICAL BREACH DETECTED!', 'alert');
    }
  },
  setLockdown: (locked) => {
    set({ lockdown: locked });
    get().addLog(locked ? 'SECURITY: Lockdown activated' : 'SECURITY: Lockdown released', locked ? 'alert' : 'warning');
  },
  
  selectModule: (moduleId) => set({ selectedModule: moduleId }),
  updateModuleSpec: (moduleId, spec) => {
    set((state) => {
      const specs = { ...state.moduleSpecs };
      if (specs[moduleId]) {
        specs[moduleId] = { ...specs[moduleId], ...spec };
      }
      return { moduleSpecs: specs };
    });
  },
  
  resetSystem: () => set({
    power: 'GRID',
    batteryLevel: 100,
    generatorFuel: [100, 100, 100, 100],
    gridActive: true,
    gridVoltage: 230,
    viewMode: 'PHYSICAL',
    visibleLevels: [true, true, true, true, true],
    maintenanceMode: false,
    authenticated: false,
    sectorStatus: ['GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN'],
    drawerStates: {},
    lockedDoors: [true, true, true, true],
    dataPackets: [],
    pcmTemp: 25,
    pumpActive: true,
    coolantFlow: 1,
    ambientTemp: 22,
    alarmActive: false,
    lockdown: false,
    selectedModule: null,
    moduleSpecs: initialModuleSpecs
  })
}));