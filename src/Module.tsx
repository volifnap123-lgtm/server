import { useRef, useState } from 'react';
import { RoundedBox, Html, Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useServerStore } from './store';

const CUBE_SIZE = 2;

interface DrawerModuleProps {
  id: string;
  label: string;
  labelRu: string;
  position: [number, number, number];
  size?: [number, number, number];
  sector: number;
  level: number;
  isPowered: boolean;
  status?: 'active' | 'idle' | 'warning' | 'error';
  children?: React.ReactNode;
}

export function DrawerModule({
  id,
  label,
  labelRu,
  position,
  size = [0.8, 0.1, 0.6],
  sector,
  isPowered,
  status = 'idle',
  children
}: DrawerModuleProps) {
  const drawerStates = useServerStore((s) => s.drawerStates);
  const maintenanceMode = useServerStore((s) => s.maintenanceMode);
  const lockedDoors = useServerStore((s) => s.lockedDoors);
  const setDrawerState = useServerStore((s) => s.setDrawerState);
  const addLog = useServerStore((s) => s.addLog);
  const selectModule = useServerStore((s) => s.selectModule);
  
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  const isDoorLocked = lockedDoors[sector];
  const drawerState = drawerStates[id] || 'LOCKED';
  
  const { slideX, rotationY, scale } = useSpring({
    slideX: drawerState === 'OPEN' ? 0.5 : drawerState === 'REMOVED' ? 1.0 : 0,
    rotationY: drawerState === 'OPEN' ? Math.PI / 5 : 0,
    scale: drawerState === 'REMOVED' ? 0.8 : 1,
    config: { mass: 1, tension: 180, friction: 24 }
  });

  const getStatusColor = () => {
    if (!isPowered) return '#1a1a1a';
    switch (status) {
      case 'error': return '#ff2200';
      case 'warning': return '#ff8800';
      case 'active': return '#00aa44';
      default: return '#2a2a3a';
    }
  };

  const getLedColor = () => {
    if (!isPowered) return '#111111';
    switch (status) {
      case 'error': return '#ff0000';
      case 'warning': return '#ffaa00';
      case 'active': return '#00ff00';
      default: return '#004400';
    }
  };

  const handleClick = () => {
    if (!maintenanceMode) {
      addLog('ACCESS DENIED. Enter Maintenance Mode first.', 'warning');
      return;
    }
    if (isDoorLocked) {
      addLog(`Door ${sector + 1} is locked.`, 'warning');
      return;
    }
    const nextState = drawerState === 'LOCKED' ? 'OPEN' : drawerState === 'OPEN' ? 'LOCKED' : 'LOCKED';
    setDrawerState(id, nextState);
    if (nextState === 'OPEN') {
      selectModule(id);
      addLog(`Drawer ${label} opened.`, 'info');
    } else {
      selectModule(null);
    }
  };

  return (
    <group position={position}>
      <animated.group
        ref={groupRef}
        position-x={slideX}
        rotation-y={rotationY}
        scale={scale}
        onClick={handleClick}
        onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <RoundedBox args={size as [number, number, number]} radius={0.015} smoothness={4}>
          <meshStandardMaterial
            color={getStatusColor()}
            metalness={0.6}
            roughness={0.3}
            transparent
            opacity={0.95}
          />
        </RoundedBox>
        
        <mesh position={[0, 0.06, size[2] / 2 - 0.02]}>
          <boxGeometry args={[0.15, 0.08, 0.04]} />
          <meshStandardMaterial color="#222222" metalness={0.9} />
        </mesh>
        
        <mesh position={[size[0] / 2 - 0.08, 0.06, -size[2] / 2 + 0.1]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial 
            color={getLedColor()} 
            emissive={getLedColor()} 
            emissiveIntensity={isPowered && status !== 'idle' ? 1.2 : 0.1}
          />
        </mesh>
        
        {size[0] > 0.5 && (
          <>
            <mesh position={[0, 0.065, 0]}>
              <boxGeometry args={[size[0] - 0.1, 0.02, size[2] - 0.1]} />
              <meshStandardMaterial color="#0a0a12" metalness={0.5} />
            </mesh>
            
            {children}
          </>
        )}
        
        <pointLight
          position={[0, 0.15, 0]}
          intensity={isPowered && status !== 'idle' ? 0.2 : 0}
          color={getLedColor()}
          distance={0.4}
        />
        
        {hovered && (
          <Html position={[0, 0.35, 0]} center distanceFactor={3}>
            <div style={{
              background: 'rgba(0,0,0,0.95)',
              padding: '8px 14px',
              borderRadius: '6px',
              border: `2px solid ${maintenanceMode ? '#00ff88' : '#ff6600'}`,
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#fff',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}>
              <div style={{ color: '#00ff88', fontWeight: 'bold' }}>{label}</div>
              <div style={{ color: '#88aaff', fontSize: '9px' }}>{labelRu}</div>
              <div style={{ color: status === 'active' ? '#00ff00' : status === 'error' ? '#ff0000' : '#666', fontSize: '9px', marginTop: '4px' }}>
                {status.toUpperCase()}
              </div>
            </div>
          </Html>
        )}
      </animated.group>
    </group>
  );
}

interface LockedDoorProps {
  sector: number;
  side: 'left' | 'right';
}

export function LockedDoor({ sector, side }: LockedDoorProps) {
  const lockedDoors = useServerStore((s) => s.lockedDoors);
  const maintenanceMode = useServerStore((s) => s.maintenanceMode);
  const setDoorState = useServerStore((s) => s.setDoorState);
  const addLog = useServerStore((s) => s.addLog);
  
  const [hovered, setHovered] = useState(false);
  const isLocked = lockedDoors[sector];
  
  const { doorRotation } = useSpring({
    doorRotation: maintenanceMode && !isLocked ? (side === 'left' ? -Math.PI / 2.5 : Math.PI / 2.5) : 0,
    config: { mass: 2, tension: 120, friction: 20 }
  });

  const handleClick = () => {
    if (!maintenanceMode) return;
    setDoorState(sector, !isLocked);
    addLog(`Door ${sector + 1} ${!isLocked ? 'unlocked' : 'locked'}`, 'info');
  };

  return (
    <animated.group
      position={[
        side === 'left' ? -CUBE_SIZE / 2 - 0.02 : CUBE_SIZE / 2 + 0.02,
        0,
        sector * 0.5 - 0.75
      ]}
      rotation-y={doorRotation}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[0.03, 0.48, 0.48]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.15} />
      </RoundedBox>
      
      <mesh position={[side === 'left' ? 0.02 : -0.02, 0, 0.18]}>
        <boxGeometry args={[0.04, 0.1, 0.1]} />
        <meshStandardMaterial
          color={isLocked ? '#ff0022' : '#00ff44'}
          emissive={isLocked ? '#ff0022' : '#00ff44'}
          emissiveIntensity={0.7}
        />
      </mesh>
      
      <Text 
        position={[0, 0, -0.15]} 
        fontSize={0.06} 
        color={isLocked ? '#ff4444' : '#44ff44'}
        rotation={[0, Math.PI / 2, 0]}
      >
        {`DOOR ${sector + 1}`}
      </Text>
      
      {hovered && maintenanceMode && (
        <Html position={[side === 'left' ? 0.25 : -0.25, 0, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            padding: '6px 10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '10px',
            color: isLocked ? '#ff4444' : '#44ff44',
            whiteSpace: 'nowrap'
          }}>
            {isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
            <br/>
            <span style={{fontSize: '8px', color: '#666'}}>Click to toggle</span>
          </div>
        </Html>
      )}
    </animated.group>
  );
}

interface BatteryModuleProps {
  position: [number, number, number];
}

export function BatteryModule({ position }: BatteryModuleProps) {
  const batteryLevel = useServerStore((s) => s.batteryLevel);
  const power = useServerStore((s) => s.power);
  
  const isActive = power === 'BATTERY' || power === 'CAPACITOR';
  const chargeColor = isActive ? '#0088ff' : '#002244';
  
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.7, 0.15, 0.5]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.7} />
      </mesh>
      
      {[0, 0.12, 0.24].map((z, i) => (
        <mesh key={i} position={[0, 0.2, z]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial 
            color={chargeColor} 
            emissive={isActive ? chargeColor : '#001133'}
            emissiveIntensity={isActive ? 0.8 : 0.1}
          />
        </mesh>
      ))}
      
      <mesh position={[0.25, 0.2, 0.12]}>
        <boxGeometry args={[0.08, 0.12, 0.12]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      <Text position={[0, 0.35, 0]} fontSize={0.08} color="#00aaff">
        {`${batteryLevel}%`}
      </Text>
    </group>
  );
}

interface GeneratorModuleProps {
  position: [number, number, number];
  number: number;
}

export function GeneratorModule({ position, number }: GeneratorModuleProps) {
  const generatorFuel = useServerStore((s) => s.generatorFuel);
  const isActive = generatorFuel[number] > 0;
  
  const fuelColor = generatorFuel[number] > 50 ? '#00ff88' : generatorFuel[number] > 20 ? '#ffaa00' : '#ff2200';
  
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} />
      </mesh>
      
      <mesh position={[0, 0.24, 0]}>
        <torusGeometry args={[0.1, 0.02, 8, 16]} />
        <meshStandardMaterial 
          color={fuelColor}
          emissive={isActive ? fuelColor : '#331100'}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </mesh>
      
      <mesh position={[0, 0.12, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.9} />
      </mesh>
      
      <Text position={[0, 0.38, 0]} fontSize={0.07} color="#00ffff">
        {`H2 #${number + 1}`}
      </Text>
      
      <Text position={[0, 0.3, 0]} fontSize={0.06} color={fuelColor}>
        {`${generatorFuel[number]}%`}
      </Text>
    </group>
  );
}

interface RelayModuleProps {
  position: [number, number, number];
}

export function RelayModule({ position }: RelayModuleProps) {
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  const power = useServerStore((s) => s.power);
  
  const isPowered = power !== 'OFF';
  const isTripped = sectorStatus[0] === 'RED';
  
  const { armRotation } = useSpring({
    armRotation: isTripped ? -0.5 : 0,
    config: { mass: 2, tension: 200, friction: 18 }
  });

  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.18, 0.6]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      
      <mesh position={[-0.25, 0.1, 0.2]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[-0.25, 0.1, -0.2]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      <animated.group position={[0.15, 0.12, 0]} rotation-z={armRotation}>
        <RoundedBox args={[0.3, 0.05, 0.08]} radius={0.01}>
          <meshStandardMaterial color="#666666" metalness={0.9} />
        </RoundedBox>
        <mesh position={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
          <meshStandardMaterial color="#444444" metalness={0.9} />
        </mesh>
      </animated.group>
      
      <mesh position={[-0.25, 0.15, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial 
          color={isPowered ? (isTripped ? '#ff0000' : '#00ff00') : '#333333'}
          emissive={isPowered ? (isTripped ? '#ff0000' : '#00ff00') : '#000000'}
          emissiveIntensity={isPowered ? 1 : 0}
        />
      </mesh>
      
      <Text position={[0, 0.32, 0]} fontSize={0.08} color={isTripped ? '#ff0000' : '#00ff00'}>
        {isTripped ? 'TRIPPED' : 'CLOSED'}
      </Text>
    </group>
  );
}