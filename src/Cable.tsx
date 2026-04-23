import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface CableProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  type: 'power' | 'data' | 'control' | 'coolant';
  status?: 'active' | 'broken' | 'inactive';
  midOffset?: [number, number, number];
}

export function Cable({ start, end, color, type, status = 'active', midOffset = [0, 0, 0] }: CableProps) {
  const { geometry, midPoint } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    
    const mid = new THREE.Vector3(
      (s.x + e.x) / 2 + midOffset[0],
      (s.y + e.y) / 2 + midOffset[1],
      (s.z + e.z) / 2 + midOffset[2]
    );
    
    let radius = 0.008;
    if (type === 'power') radius = 0.025;
    if (type === 'coolant') radius = 0.02;
    if (type === 'data') radius = 0.006;
    
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    const geometry = new THREE.TubeGeometry(curve, 24, radius, 6, false);
    
    return { geometry, midPoint: mid };
  }, [start, end, type, midOffset]);

  const getMaterial = () => {
    const isBroken = status === 'broken';
    const isInactive = status === 'inactive';
    
    return {
      color: isBroken ? '#333333' : color,
      emissive: isBroken ? '#ff0000' : isInactive ? '#000000' : color,
      emissiveIntensity: isBroken ? 0.8 : isInactive ? 0 : type === 'data' ? 1.2 : type === 'power' ? 0.6 : 0.3,
      transparent: true,
      opacity: isInactive ? 0.1 : isBroken ? 0.2 : 0.9
    };
  };

  if (status === 'broken') {
    return (
      <group>
        <mesh geometry={geometry}>
          <meshStandardMaterial {...getMaterial()} />
        </mesh>
        <mesh position={midPoint.toArray()}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
        </mesh>
        <Html position={midPoint.toArray()} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '2px 4px',
            borderRadius: '2px',
            color: '#ff0000',
            fontSize: '7px',
            fontFamily: 'monospace'
          }}>
            ⚡ BROKEN
          </div>
        </Html>
        <pointLight position={midPoint.toArray()} color="#ff0000" intensity={0.5} distance={0.5} />
      </group>
    );
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial {...getMaterial()} />
    </mesh>
  );
}

interface CoolantPipeProps {
  start: [number, number, number];
  end: [number, number, number];
  flow: number;
  isHot: boolean;
}

export function CoolantPipe({ start, end, flow, isHot }: CoolantPipeProps) {
  const color = isHot ? '#ff3300' : '#0066ff';
  
  return (
    <group>
      <Cable start={start} end={end} color={color} type="coolant" status={flow > 0 ? 'active' : 'inactive'} />
      {flow > 0 && (
        <pointLight
          position={[
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2,
            (start[2] + end[2]) / 2
          ]}
          color={color}
          intensity={0.3 * flow}
          distance={0.4}
        />
      )}
    </group>
  );
}