import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Html, Box, Cylinder } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useServerStore } from './store';

const CUBE_SIZE = 2.2;
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

  const power = useServerStore((s) => s.power);
  const isPowered = power !== 'OFF';
  const xrayMode = viewMode === 'XRAY';
  const opacity = xrayMode ? 0.15 : 0.98;

  const frameColor = '#0d0d12';
  const frameMetalness = xrayMode ? 0.3 : 0.95;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <RoundedBox args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} radius={0.04} smoothness={6} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={frameColor}
          metalness={frameMetalness}
          roughness={xrayMode ? 0.8 : 0.12}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
      
      {[0,1,2,3,4].map((i) => (
        visibleLevels[i] && (
          <mesh key={i} position={[0, -CUBE_SIZE / 2 + LEVEL_HEIGHT * (i + 0.5), 0]}>
            <boxGeometry args={[CUBE_SIZE - 0.06, 0.015, CUBE_SIZE - 0.06]} />
            <meshStandardMaterial color="#151520" metalness={0.7} />
          </mesh>
        )
      ))}
      
      <Text position={[0, CUBE_SIZE / 2 + 0.2, 0]} fontSize={0.1} color="#00ff88" anchorX="center">
        BASTION-CHRONOS
      </Text>
      <Text position={[0, CUBE_SIZE / 2 + 0.08, 0]} fontSize={0.05} color="#445" anchorX="center">
        Промышленный сервер безопасности
      </Text>
      
      {[0, 1, 2, 3].map((sector) => (
        <group key={`door-${sector}`}>
          <ServerDoor sector={sector} side="left" />
          <ServerDoor sector={sector} side="right" />
        </group>
      ))}
      
      <Level0 visible={visibleLevels[0]} isPowered={isPowered} />
      <Level1 visible={visibleLevels[1]} />
      <Level2 visible={visibleLevels[2]} isPowered={isPowered} />
      <Level3 visible={visibleLevels[3]} isPowered={isPowered} />
      <Level4 visible={visibleLevels[4]} isPowered={isPowered} />
      
      <CoolingSystem visible={true} pcmTemp={pcmTemp} flow={coolantFlow} />
    </group>
  );
}

function ServerDoor({ sector, side }: { sector: number; side: 'left' | 'right' }) {
  const lockedDoors = useServerStore((s) => s.lockedDoors);
  const maintenanceMode = useServerStore((s) => s.maintenanceMode);
  const setDoorState = useServerStore((s) => s.setDoorState);
  const addLog = useServerStore((s) => s.addLog);
  
  const [hovered, setHovered] = useState(false);
  const isLocked = lockedDoors[sector];
  
  const { doorRotation } = useSpring({
    doorRotation: maintenanceMode && !isLocked ? (side === 'left' ? -Math.PI / 2.2 : Math.PI / 2.2) : 0,
    config: { mass: 2, tension: 100, friction: 18 }
  });

  const handleClick = () => {
    if (!maintenanceMode) {
      addLog('Доступ запрещён. Войдите в режим обслуживания.', 'warning');
      return;
    }
    setDoorState(sector, !isLocked);
    addLog(`Дверь ${sector + 1} ${!isLocked ? 'открыта' : 'закрыта'}`, 'info');
  };

  return (
    <animated.group
      position={[
        side === 'left' ? -CUBE_SIZE / 2 - 0.015 : CUBE_SIZE / 2 + 0.015,
        0,
        sector * 0.55 - 0.82
      ]}
      rotation-y={doorRotation}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[0.025, 0.55, 0.52]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </RoundedBox>
      
      <mesh position={[side === 'left' ? 0.018 : -0.018, 0.15, 0.2]}>
        <boxGeometry args={[0.03, 0.12, 0.12]} />
        <meshStandardMaterial
          color={isLocked ? '#ff0022' : '#00ff44'}
          emissive={isLocked ? '#ff0022' : '#00ff44'}
          emissiveIntensity={0.8}
        />
      </mesh>
      
      <mesh position={[side === 'left' ? 0.018 : -0.018, 0.15, -0.05]}>
        <boxGeometry args={[0.02, 0.06, 0.06]} />
        <meshStandardMaterial color="#222222" metalness={0.9} />
      </mesh>
      
      <Text 
        position={[0, -0.15, 0]}
        fontSize={0.055} 
        color={isLocked ? '#ff4444' : '#44ff44'}
        rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
        anchorX="center"
      >
        {`СЕКТОР ${sector + 1}`}
      </Text>
      
      {hovered && maintenanceMode && (
        <Html position={[side === 'left' ? 0.3 : -0.3, 0, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            padding: '6px 10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '10px',
            color: isLocked ? '#ff4444' : '#44ff44',
          }}>
            {isLocked ? '🔒 ЗАКРЫТО' : '🔓 ОТКРЫТО'}
          </div>
        </Html>
      )}
    </animated.group>
  );
}

function Level0({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT / 2;
  const generatorFuel = useServerStore((s) => s.generatorFuel);
  const power = useServerStore((s) => s.power);
  const gridActive = useServerStore((s) => s.gridActive);
  
  if (!visible) return null;
  
  const batteryColor = power === 'BATTERY' || power === 'CAPACITOR' ? '#0055aa' : '#002244';
  const batteryGlow = power === 'BATTERY' || power === 'CAPACITOR';

  return (
    <group position={[0, y, 0]}>
      <PCBMesh id="battery" label="LiFePO4 Батарея" position={[-0.35, 0.12, 0]} size={[0.75, 0.12, 0.55]} color={batteryColor} glow={batteryGlow} isPowered={isPowered} />
      
      {[
        [-0.8, 0], [-0.6, 0], [0.6, 0], [0.8, 1]
      ].map(([x, i]) => (
        <HydrogenCell key={i} position={[x as number, 0.12, 0]} index={i as number} fuel={generatorFuel[i as number]} />
      ))}
      
      <PCBMesh id="ats" label="ATS Переключатель" position={[0.75, 0.12, 0]} size={[0.45, 0.12, 0.45]} color="#1a1a1a" glow={gridActive} isPowered={gridActive} ledColor={gridActive ? '#00ff44' : '#ff4400'} />
    </group>
  );
}

function Level1({ visible }: { visible: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 1.5;
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  
  if (!visible) return null;
  
  const modules = [
    { id: 'data-0', label: 'Входной шлюз', color: '#001a22' },
    { id: 'data-1', label: 'Лаборатория угроз', color: '#221100' },
    { id: 'data-2', label: 'Чистая зона', color: '#002211' },
    { id: 'data-3', label: 'Контроль исходящих', color: '#110022' },
  ];
  
  return (
    <group position={[0, y, 0]}>
      {modules.map((mod, i) => (
        <PCBMesh 
          key={mod.id} 
          id={mod.id} 
          label={mod.label} 
          position={[i * 0.5 - 0.75, 0.12, 0]} 
          size={[0.4, 0.1, 0.55]} 
          color={mod.color}
          glow={sectorStatus[i] === 'GREEN'}
          isPowered={sectorStatus[i] !== 'OFFLINE'}
          ledColor={sectorStatus[i] === 'GREEN' ? '#00ff44' : sectorStatus[i] === 'RED' ? '#ff0000' : '#333333'}
        />
      ))}
      <PCBMesh id="audit-l1" label="Модуль аудита L1" position={[0, 0.12, 0.75]} size={[0.35, 0.08, 0.25]} color="#001100" glow={true} isPowered={true} ledColor="#00ff44" />
    </group>
  );
}

function Level2({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 2.5;
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  
  if (!visible) return null;
  
  const isTripped = sectorStatus[0] === 'RED';
  
  return (
    <group position={[0, y, 0]}>
      <MasterRelayUnit position={[0, 0.12, 0]} isTripped={isTripped} isPowered={isPowered} />
      
      <PCBMesh id="diagnostics" label="Диагностика" position={[-0.75, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#111100" glow={isPowered} isPowered={isPowered} />
      <PCBMesh id="aggregator" label="Агрегатор" position={[-0.25, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#100011" glow={isPowered} isPowered={isPowered} />
      <PCBMesh id="heartbeat" label="Монитор сердцебиения" position={[0.25, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#001111" glow={isPowered} isPowered={isPowered} />
      <PCBMesh id="audit-l2" label="Модуль аудита L2" position={[0, 0.12, 0.75]} size={[0.35, 0.08, 0.25]} color="#001100" glow={true} isPowered={isPowered} />
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
      <PCBMesh id="pdu" label="Умный PDU" position={[-0.75, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#1a0a00" glow={isPowered} isPowered={isPowered} ledColor="#ff6600" />
      <PCBMesh id="climate" label="Климат-контроль" position={[-0.25, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#001a0a" glow={isPowered} isPowered={isPowered} />
      <PCBMesh id="resource" label="Арбитр ресурсов" position={[0.25, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#0a0010" glow={isPowered} isPowered={isPowered} ledColor="#aa00ff" />
      <PCBMesh id="admin" label="Терминал админа" position={[0.75, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#1a1a1a" glow={false} isPowered={false} />
      <PCBMesh id="capacitor" label="Суперконденсатор" position={[-0.5, 0.12, 0.75]} size={[0.45, 0.1, 0.35]} color="#001122" glow={isCapacitor} isPowered={isCapacitor} ledColor={isCapacitor ? '#00aaff' : '#333333'} />
      <PCBMesh id="audit-l3" label="Модуль аудита L3" position={[0.5, 0.12, 0.75]} size={[0.35, 0.08, 0.25]} color="#001100" glow={true} isPowered={isPowered} />
    </group>
  );
}

function Level4({ visible, isPowered }: { visible: boolean; isPowered: boolean }) {
  const y = -CUBE_SIZE / 2 + LEVEL_HEIGHT * 4.5;
  
  if (!visible) return null;
  
  return (
    <group position={[0, y, 0]}>
      <PCBMesh id="buffer" label="Унифицированный буфер" position={[-0.75, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#001020" glow={isPowered} isPowered={isPowered} />
      <PCBMesh id="policy" label="Политика Engine" position={[-0.25, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#100018" glow={isPowered} isPowered={isPowered} ledColor="#aa00ff" />
      <PCBMesh id="container" label="Контейнер фабрика" position={[0.25, 0.12, 0]} size={[0.4, 0.1, 0.5]} color="#001810" glow={isPowered} isPowered={isPowered} />
      <PCBMesh id="transport-in" label="Опт. приёмник" position={[0.75, 0.12, -0.25]} size={[0.35, 0.1, 0.35]} color="#001133" glow={isPowered} isPowered={isPowered} ledColor="#00aaff" />
      <PCBMesh id="transport-out" label="Опт. передатчик" position={[0.75, 0.12, 0.25]} size={[0.35, 0.1, 0.35]} color="#110022" glow={isPowered} isPowered={isPowered} ledColor="#ff00aa" />
      <PCBMesh id="audit-l4" label="Модуль аудита L4" position={[0, 0.12, 0.75]} size={[0.35, 0.08, 0.25]} color="#001100" glow={true} isPowered={isPowered} />
    </group>
  );
}

function PCBMesh({ id, label, position: _pos, size, color, glow, isPowered, ledColor }: any) {
  const drawerStates = useServerStore((s) => s.drawerStates);
  const maintenanceMode = useServerStore((s) => s.maintenanceMode);
  const setDrawerState = useServerStore((s) => s.setDrawerState);
  const addLog = useServerStore((s) => s.addLog);
  const selectModule = useServerStore((s) => s.selectModule);
  
  const [hovered, setHovered] = useState(false);
  
  const drawerState = drawerStates[id] || 'LOCKED';
  
  const { posX } = useSpring({
    posX: drawerState === 'OPEN' ? 0.4 : 0,
    config: { mass: 1, tension: 160, friction: 22 }
  });

  const handleClick = () => {
    if (!maintenanceMode) {
      selectModule(id);
      return;
    }
    const nextState = drawerState === 'LOCKED' ? 'OPEN' : 'LOCKED';
    setDrawerState(id, nextState);
    if (nextState === 'OPEN') {
      selectModule(id);
      addLog(`Модуль ${label} открыт`, 'info');
    } else {
      selectModule(null);
    }
  };

  return (
    <animated.group position-x={posX} onClick={handleClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <Box args={size}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
      </Box>
      
      <Box args={[size[0] - 0.06, 0.015, size[2] - 0.06]} position={[0, size[1] / 2 + 0.01, 0]}>
        <meshStandardMaterial color="#050510" metalness={0.7} />
      </Box>
      
      {size[0] > 0.3 && (
        <>
          {[-0.15, 0, 0.15].map((x, i) => (
            <mesh key={i} position={[x, size[1] / 2 + 0.02, size[2] / 2 - 0.06]}>
              <boxGeometry args={[0.02, 0.015, 0.02]} />
              <meshStandardMaterial color="#003300" emissive={ledColor || (isPowered ? '#00ff44' : '#222222')} emissiveIntensity={isPowered ? 0.8 : 0.1} />
            </mesh>
          ))}
          
          {[[-0.12, -0.1], [0.08, -0.1], [-0.12, 0.1], [0.08, 0.1]].map(([x, z], i) => (
            <mesh key={i} position={[x, size[1] / 2 + 0.025, z]}>
              <boxGeometry args={[0.08, 0.04, 0.04]} />
              <meshStandardMaterial color="#111111" metalness={0.8} />
            </mesh>
          ))}
        </>
      )}
      
      {hovered && (
        <Html position={[0, size[1] + 0.25, 0]} center distanceFactor={3}>
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            padding: '6px 10px',
            borderRadius: '4px',
            border: `1px solid ${maintenanceMode ? '#00ff88' : '#ff6600'}`,
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#fff',
            whiteSpace: 'nowrap'
          }}>
            <div style={{color: '#00ff88'}}>{label}</div>
            <div style={{color: glow ? '#00ff44' : '#666'}}>{isPowered ? '● Активен' : '○ Простой'}</div>
          </div>
        </Html>
      )}
      
      {glow && (
        <pointLight position={[0, size[1] + 0.1, 0]} intensity={0.15} color={ledColor || '#00ff44'} distance={0.35} />
      )}
    </animated.group>
  );
}

function HydrogenCell({ position, index, fuel }: { position: [number, number, number]; index: number; fuel: number }) {
  const isActive = fuel > 0;
  const fuelColor = fuel > 50 ? '#00ff88' : fuel > 20 ? '#ffaa00' : '#ff3333';
  
  return (
    <group position={position}>
      <Cylinder args={[0.16, 0.18, 0.18, 16]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.92} roughness={0.08} />
      </Cylinder>
      
      <Cylinder args={[0.1, 0.1, 0.04, 16]} position={[0, 0.2, 0]}>
        <meshStandardMaterial 
          color={fuelColor}
          emissive={isActive ? fuelColor : '#331100'}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </Cylinder>
      
      <Cylinder args={[0.04, 0.04, 0.1, 8]} position={[0, 0.1, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.9} />
      </Cylinder>
      
      <Text position={[0, 0.32, 0]} fontSize={0.055} color="#00ffff" anchorX="center">
        H₂ #{index + 1}
      </Text>
      <Text position={[0, 0.25, 0]} fontSize={0.045} color={fuelColor} anchorX="center">
        {`${fuel}%`}
      </Text>
    </group>
  );
}

function MasterRelayUnit({ position, isTripped, isPowered }: { position: [number, number, number]; isTripped: boolean; isPowered: boolean }) {
  const { armRot } = useSpring({
    armRot: isTripped ? -0.45 : 0,
    config: { mass: 2, tension: 180, friction: 16 }
  });

  return (
    <group position={position}>
      <RoundedBox args={[0.8, 0.16, 0.65]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.15} />
      </RoundedBox>
      
      <Box args={[0.15, 0.1, 0.05]} position={[-0.3, 0.08, 0.25]}>
        <meshStandardMaterial color="#222222" />
      </Box>
      <Box args={[0.15, 0.1, 0.05]} position={[-0.3, 0.08, -0.25]}>
        <meshStandardMaterial color="#222222" />
      </Box>
      
      <animated.group position={[0.15, 0.1, 0]} rotation-z={armRot}>
        <Box args={[0.35, 0.06, 0.1]}>
          <meshStandardMaterial color="#555555" metalness={0.9} />
        </Box>
        <Cylinder args={[0.025, 0.025, 0.05, 8]} position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" metalness={0.9} />
        </Cylinder>
      </animated.group>
      
      <mesh position={[-0.3, 0.14, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial 
          color={isPowered ? (isTripped ? '#ff0000' : '#00ff00') : '#333333'}
          emissive={isPowered ? (isTripped ? '#ff0000' : '#00ff00') : '#000000'}
          emissiveIntensity={isPowered ? 1 : 0}
        />
      </mesh>
      
      <Text position={[0, 0.28, 0]} fontSize={0.07} color={isTripped ? '#ff0000' : '#00ff00'}>
        {isTripped ? 'СРАБОТАЛ' : 'ЗАКРЫТ'}
      </Text>
    </group>
  );
}

function CoolingSystem({ visible, pcmTemp, flow }: { visible: boolean; pcmTemp: number; flow: number }) {
  if (!visible) return null;
  
  const isHot = pcmTemp > 50;
  const pipeColor = isHot ? '#aa2200' : '#0044aa';
  
  return (
    <group>
      <mesh position={[0, -CUBE_SIZE / 2 + 0.03, CUBE_SIZE / 2 - 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, CUBE_SIZE - 0.2, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
      </mesh>
      
      <mesh position={[0, -CUBE_SIZE / 2 + 0.03, CUBE_SIZE / 2 - 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, CUBE_SIZE - 0.25, 8]} />
        <meshStandardMaterial 
          color={pipeColor}
          emissive={pipeColor}
          emissiveIntensity={flow > 0 ? 0.6 : 0.1}
          transparent
          opacity={flow > 0 ? 0.9 : 0.3}
        />
      </mesh>
    </group>
  );
}