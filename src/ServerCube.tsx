import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { DrawerModule, LockedDoor } from './Module';
import { Cable, CoolantPipe } from './Cable';
import { MasterRelay } from './Relay';
import { useServerStore } from './store';

const CUBE_SIZE = 2;
const LEVEL_HEIGHT = CUBE_SIZE / 5;

export function ServerCube() {
  const groupRef = useRef<THREE.Group>(null);
  const viewMode = useServerStore((s) => s.viewMode);
  const visibleLevels = useServerStore((s) => s.visibleLevels);
  const pcmTemp = useServerStore((s) => s.pcmTemp);
  const coolantFlow = useServerStore((s) => s.coolantFlow);
  
  const updatePackets = useServerStore((s) => s.updatePackets);
  
  useFrame(() => {
    updatePackets();
  });

  const isPowered = useServerStore((s) => s.power) !== 'OFF';
  const xrayMode = viewMode === 'XRAY';
  const opacity = xrayMode ? 0.25 : 0.95;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <RoundedBox args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} radius={0.03} smoothness={4}>
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
      
      {[0,1,2,3,4].map((i) => (
        visibleLevels[i] && (
          <RoundedBox key={i} args={[CUBE_SIZE - 0.05, 0.01, CUBE_SIZE - 0.05]} radius={0.005} position={[0, -CUBE_SIZE / 2 + LEVEL_HEIGHT * (i + 0.5), 0]}>
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} />
          </RoundedBox>
        )
      ))}
      
      <Text position={[0, CUBE_SIZE / 2 + 0.15, 0]} fontSize={0.08} color="#00ff88">BASTION-CHRONOS</Text>
      <Text position={[0, CUBE_SIZE / 2 + 0.06, 0]} fontSize={0.04} color="#444444">Industrial Security Server</Text>
      
      {[0, 1, 2, 3].map((sector) => (
        <group key={`door-${sector}`}>
          <LockedDoor sector={sector} side="left" />
          <LockedDoor sector={sector} side="right" />
        </group>
      ))}
      
      <Level0 visible={visibleLevels[0]} isPowered={isPowered} />
      <Level1 visible={visibleLevels[1]} />
      <Level2 visible={visibleLevels[2]} isPowered={isPowered} />
      <Level3 visible={visibleLevels[3]} isPowered={isPowered} />
      <Level4 visible={visibleLevels[4]} isPowered={isPowered} />
      
      <ThermalSystem visible={true} pcmTemp={pcmTemp} flow={coolantFlow} />
    </group>
  );
}

function Level0({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT / 2;
  const generatorFuel = useServerStore((s) => s.generatorFuel);
  const power = useServerStore((s) => s.power);
  const gridActive = useServerStore((s) => s.gridActive);
  
  if (!visible) return null;
  
  const batteryColor = power === 'BATTERY' ? '#0066ff' : power === 'CAPACITOR' ? '#00ffff' : '#003388';
  const batteryGlow = power === 'BATTERY' || power === 'CAPACITOR';

  return (
    <group position={[0, y, 0]}>
      <DrawerModule id="battery" label="LiFePO4 Battery" labelRu="LiFePO4 Батарея" position={[-0.3, 0.1, 0]} sector={2} level={0} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.3]} />
          <meshStandardMaterial color={batteryColor} emissive={batteryGlow ? batteryColor : '#000022'} emissiveIntensity={batteryGlow ? 0.8 : 0.1} />
        </mesh>
      </DrawerModule>
      
      {[[-0.7, 0], [-0.5, 0], [0.5, 0], [0.7, 1]].map(([x, i]) => (
        <DrawerModule key={i} id={`generator-${i}`} label={`H2 Generator #${i + 1}`} labelRu={`Водородный Генератор #${i + 1}`} position={[x as number, 0.1, 0]} sector={i > 1 ? 3 : 0} level={0} isPowered={(generatorFuel[i] as number) > 0}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.15, 12]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.08, 0.015, 8, 16]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={isPowered ? 0.6 : 0.1} />
          </mesh>
        </DrawerModule>
      ))}
      
      <DrawerModule id="ats" label="ATS Switch" labelRu="ATS Переключатель" position={[0.7, 0.1, 0]} size={[0.4, 0.1, 0.4]} sector={3} level={0} isPowered={gridActive}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.25, 0.08, 0.25]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.14, 0.08]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={gridActive ? '#00ff00' : '#ff6600'} emissive={gridActive ? '#00ff00' : '#ff6600'} emissiveIntensity={0.8} />
        </mesh>
      </DrawerModule>
      
      <Cable start={[-0.3, 0.05, 0]} end={[0.7, 0.05, 0]} color="#ff6600" type="power" status={isPowered ? 'active' : 'inactive'} />
    </group>
  );
}

function Level1({ visible }: { visible: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 1.5;
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  
  if (!visible) return null;
  
  return (
    <group position={[0, y, 0]}>
      {[0, 1, 2, 3].map((sector) => (
        <DrawerModule key={sector} id={`data-${sector}`} label={`Data Sector ${sector + 1}`} labelRu={`Сектор Данных ${sector + 1}`} position={[sector * 0.45 - 0.675, 0.1, 0]} sector={sector} level={1} isPowered={sectorStatus[sector] !== 'OFFLINE'} status={sectorStatus[sector] === 'GREEN' ? 'active' : sectorStatus[sector] === 'RED' ? 'error' : 'idle'}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.35, 0.08, 0.5]} />
            <meshStandardMaterial color="#0a1a1a" emissive={sectorStatus[sector] === 'GREEN' ? '#00ff00' : '#000011'} emissiveIntensity={sectorStatus[sector] === 'GREEN' ? 0.4 : 0.05} />
          </mesh>
        </DrawerModule>
      ))}
      <DrawerModule id="audit-l1" label="Audit Module" labelRu="Модуль Аудита" position={[0, 0.1, 0.7]} size={[0.3, 0.08, 0.2]} sector={4} level={1} isPowered={true}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.2, 0.06, 0.15]} />
          <meshStandardMaterial color="#001100" emissive="#00ff00" emissiveIntensity={0.3} />
        </mesh>
      </DrawerModule>
    </group>
  );
}

function Level2({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 2.5;
  
  if (!visible) return null;
  
  return (
    <group position={[0, y, 0]}>
      <MasterRelay position={[0, 0.1, 0]} sector={0} />
      
      {[1, 2, 3].map((sector) => (
        <DrawerModule key={sector} id={`security-${sector}`} label={`Security ${sector}`} labelRu={`Безопасность ${sector}`} position={[sector * 0.45 - 0.675, 0.1, 0]} sector={sector} level={2} isPowered={isPowered}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.35, 0.08, 0.5]} />
            <meshStandardMaterial color="#1a1a0a" emissive="#00ff88" emissiveIntensity={isPowered ? 0.4 : 0} />
          </mesh>
        </DrawerModule>
      ))}
      
      <DrawerModule id="audit-l2" label="Audit Module" labelRu="Модуль Аудита" position={[0, 0.1, 0.7]} size={[0.3, 0.08, 0.2]} sector={4} level={2} isPowered={isPowered}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.2, 0.06, 0.15]} />
          <meshStandardMaterial color="#001100" emissive="#00ff00" emissiveIntensity={0.3} />
        </mesh>
      </DrawerModule>
    </group>
  );
}

function Level3({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 3.5;
  const power = useServerStore((s) => s.power);
  
  if (!visible) return null;
  
  const isCapacitor = power === 'CAPACITOR';
  
  return (
    <group position={[0, y, 0]}>
      <DrawerModule id="pdu" label="Smart PDU" labelRu="Умный PDU" position={[-0.7, 0.1, 0]} sector={0} level={3} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#1a1000" emissive="#ff6600" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
      <DrawerModule id="climate" label="Climate Ctrl" labelRu="Климат" position={[-0.25, 0.1, 0]} sector={1} level={3} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#0a1a10" emissive="#00ff88" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
      <DrawerModule id="resource" label="Resource" labelRu="Ресурсы" position={[0.25, 0.1, 0]} sector={2} level={3} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#100a1a" emissive="#aa00ff" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
      <DrawerModule id="admin" label="Admin" labelRu="Админ" position={[0.7, 0.1, 0]} sector={3} level={3} isPowered={false}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      </DrawerModule>
      <DrawerModule id="capacitor" label="Capacitor" labelRu="Конденсатор" position={[-0.45, 0.1, 0.7]} size={[0.4, 0.08, 0.3]} sector={3} level={3} isPowered={isCapacitor} status={isCapacitor ? 'active' : 'idle'}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.3, 0.06, 0.2]} /><meshStandardMaterial color="#1a1a2a" emissive={isCapacitor ? '#00aaff' : '#001122'} emissiveIntensity={isCapacitor ? 1.2 : 0.1} /></mesh>
      </DrawerModule>
      <DrawerModule id="audit-l3" label="Audit" labelRu="Аудит" position={[0.45, 0.1, 0.7]} size={[0.3, 0.08, 0.2]} sector={4} level={3} isPowered={isPowered}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.2, 0.06, 0.15]} /><meshStandardMaterial color="#001100" emissive="#00ff00" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
    </group>
  );
}

function Level4({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 4.5;
  
  if (!visible) return null;
  
  return (
    <group position={[0, y, 0]}>
      <DrawerModule id="buffer" label="Buffer" labelRu="Буфер" position={[-0.7, 0.1, 0]} sector={0} level={4} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#00101a" emissive="#00aaff" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
      <DrawerModule id="policy" label="Policy" labelRu="Политика" position={[-0.25, 0.1, 0]} sector={1} level={4} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#1a001a" emissive="#aa00ff" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
      <DrawerModule id="container" label="Container" labelRu="Контейнер" position={[0.25, 0.1, 0]} sector={2} level={4} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.35, 0.08, 0.5]} /><meshStandardMaterial color="#001a10" emissive="#00ff00" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
      <DrawerModule id="transport-in" label="Part A In" labelRu="Часть A" position={[0.7, 0.1, -0.2]} size={[0.3, 0.08, 0.3]} sector={3} level={4} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.1, 0.1, 0.08, 12]} /><meshStandardMaterial color="#000033" emissive="#00aaff" emissiveIntensity={0.5} /></mesh>
      </DrawerModule>
      <DrawerModule id="transport-out" label="Part B Out" labelRu="Часть B" position={[0.7, 0.1, 0.2]} size={[0.3, 0.08, 0.3]} sector={3} level={4} isPowered={isPowered}>
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.1, 0.1, 0.08, 12]} /><meshStandardMaterial color="#220000" emissive="#ff00aa" emissiveIntensity={0.5} /></mesh>
      </DrawerModule>
      <DrawerModule id="audit-l4" label="Audit" labelRu="Аудит" position={[0, 0.1, 0.7]} size={[0.3, 0.08, 0.2]} sector={4} level={4} isPowered={isPowered}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.2, 0.06, 0.15]} /><meshStandardMaterial color="#001100" emissive="#00ff00" emissiveIntensity={0.3} /></mesh>
      </DrawerModule>
    </group>
  );
}

function ThermalSystem({ visible, pcmTemp, flow }: { visible: boolean; pcmTemp: number; flow: number }) {
  if (!visible) return null;
  const isHot = pcmTemp > 50;
  
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[CUBE_SIZE / 2 + 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, CUBE_SIZE, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
      </mesh>
      <CoolantPipe start={[-CUBE_SIZE / 2, CUBE_SIZE / 2 - 0.1, CUBE_SIZE / 2 - 0.1]} end={[CUBE_SIZE / 2, CUBE_SIZE / 2 - 0.1, CUBE_SIZE / 2 - 0.1]} flow={flow} isHot={isHot} />
    </group>
  );
}