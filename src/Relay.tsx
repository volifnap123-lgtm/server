import { useSpring, animated } from '@react-spring/three';
import { Html, RoundedBox } from '@react-three/drei';
import { useServerStore } from './store';

interface RelayProps {
  position: [number, number, number];
  sector: number;
}

export function MasterRelay({ position, sector }: RelayProps) {
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  const power = useServerStore((s) => s.power);
  
  const status = sectorStatus[sector];
  const isPowered = power !== 'OFF';
  const isTripped = status === 'RED';
  const isOffline = status === 'OFFLINE';
  
  const { armRotation, armPosition, indicatorColor } = useSpring({
    armRotation: isTripped ? -0.6 : 0,
    armPosition: isTripped ? 0.08 : 0,
    indicatorColor: isTripped ? '#ff0000' : isOffline ? '#333333' : '#00ff00',
    config: { mass: 2, tension: 200, friction: 18 }
  });

  return (
    <group position={position}>
      <RoundedBox args={[0.6, 0.15, 0.5]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.15} />
      </RoundedBox>
      
      <mesh position={[-0.2, 0.08, 0.15]}>
        <boxGeometry args={[0.15, 0.06, 0.08]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[-0.2, 0.08, -0.15]}>
        <boxGeometry args={[0.15, 0.06, 0.08]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      <animated.group position-y={armPosition}>
        <animated.group rotation-z={armRotation} position={[0.1, 0.1, 0]}>
          <RoundedBox args={[0.25, 0.04, 0.06]} radius={0.01}>
            <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.2} />
          </RoundedBox>
          
          <mesh position={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.9} />
          </mesh>
        </animated.group>
      </animated.group>
      
      <animated.mesh position={[-0.2, 0.12, 0.15]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <animated.meshStandardMaterial
          color={indicatorColor}
          emissive={indicatorColor}
          emissiveIntensity={isPowered ? 1 : 0}
        />
      </animated.mesh>
      
      <Html position={[0, 0.25, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.9)',
          padding: '4px 8px',
          borderRadius: '3px',
          border: `1px solid ${isTripped ? '#ff0000' : isOffline ? '#666666' : '#00ff00'}`,
          fontFamily: 'monospace',
          fontSize: '8px',
          color: isTripped ? '#ff0000' : isOffline ? '#666666' : '#00ff00',
          whiteSpace: 'nowrap'
        }}>
          RELAY #{sector + 1} {isTripped ? 'TRIPPED' : isOffline ? 'OFFLINE' : 'CLOSED'}
        </div>
      </Html>
    </group>
  );
}