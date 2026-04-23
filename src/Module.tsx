import { useRef, useState } from 'react';
import { RoundedBox, Html } from '@react-three/drei';
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
  
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  const isDoorLocked = lockedDoors[sector];
  const drawerState = drawerStates[id] || 'LOCKED';
  // canOpen if maintenanceMode && !isDoorLocked
  
  const { slideX, rotationY } = useSpring({
    slideX: drawerState === 'OPEN' ? 0.6 : drawerState === 'REMOVED' ? 1.2 : 0,
    rotationY: drawerState === 'OPEN' ? Math.PI / 6 : 0,
    config: { mass: 1, tension: 180, friction: 24 }
  });

  const getStatusColor = () => {
    if (!isPowered) return '#1a1a1a';
    switch (status) {
      case 'error': return '#ff0000';
      case 'warning': return '#ffaa00';
      case 'active': return '#00ff88';
      default: return '#1a2a2e';
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
      addLog(`Drawer ${label} opened.`, 'info');
    }
  };

  return (
    <group position={position}>
      <animated.group
        ref={groupRef}
        position-x={slideX}
        rotation-y={rotationY}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <RoundedBox args={size as [number, number, number]} radius={0.01} smoothness={4}>
          <meshStandardMaterial
            color={getStatusColor()}
            metalness={0.7}
            roughness={0.25}
            transparent
            opacity={0.95}
          />
        </RoundedBox>
        
        <mesh position={[size[0] / 2 - 0.05, 0.06, -size[2] / 2 + 0.08]}>
          <boxGeometry args={[0.08, 0.08, 0.04]} />
          <meshStandardMaterial color="#333333" metalness={0.9} />
        </mesh>
        
<pointLight
          position={[0, 0.1, 0]}
          intensity={isPowered && status !== 'idle' ? 0.3 : 0}
          color={status === 'error' ? '#ff0000' : status === 'warning' ? '#ffaa00' : '#00ff88'}
          distance={0.5}
        />
        
        {children}
        
        {hovered && (
          <Html position={[0, 0.3, 0]} center distanceFactor={3}>
            <div style={{
              background: 'rgba(0,0,0,0.9)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: `1px solid ${maintenanceMode ? '#00ff88' : '#ff6600'}`,
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#fff',
              whiteSpace: 'nowrap'
            }}>
              <div style={{ color: '#00ff88' }}>{label}</div>
              <div style={{ color: '#88aaff', fontSize: '9px' }}>{labelRu}</div>
              {!maintenanceMode && <div style={{ color: '#ff6600', fontSize: '8px' }}>🔒 Locked</div>}
              {maintenanceMode && drawerState === 'LOCKED' && <div style={{ color: '#00ff88', fontSize: '8px' }}>Click to open</div>}
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
  
  const [hovered, setHovered] = useState(false);
  const isLocked = lockedDoors[sector];
  
  const { doorRotation } = useSpring({
    doorRotation: maintenanceMode && !isLocked ? (side === 'left' ? -Math.PI / 3 : Math.PI / 3) : 0,
    config: { mass: 2, tension: 120, friction: 20 }
  });

  const handleClick = () => {
    if (!maintenanceMode) return;
    setDoorState(sector, !isLocked);
  };

  return (
    <animated.group
      position={[
        side === 'left' ? -CUBE_SIZE / 2 - 0.01 : CUBE_SIZE / 2 + 0.01,
        0,
        sector * 0.5 - 0.75
      ]}
      rotation-y={doorRotation}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[0.02, 0.45, 0.45]} radius={0.01} smoothness={4}>
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.85}
          roughness={0.15}
        />
      </RoundedBox>
      
      <mesh position={[side === 'left' ? 0.015 : -0.015, 0, 0]}>
        <boxGeometry args={[0.03, 0.08, 0.08]} />
        <meshStandardMaterial
          color={isLocked ? '#ff0000' : '#00ff00'}
          emissive={isLocked ? '#ff0000' : '#00ff00'}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {hovered && maintenanceMode && (
        <Html position={[side === 'left' ? 0.2 : -0.2, 0, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            padding: '4px 6px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '9px',
            color: isLocked ? '#ff0000' : '#00ff00'
          }}>
            {isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
          </div>
        </Html>
      )}
    </animated.group>
  );
}