import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CableProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  type: 'power' | 'data' | 'control';
  isBroken?: boolean;
  isActive?: boolean;
}

export function Cable({ start, end, color, type, isBroken = false, isActive = true }: CableProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  const { curve, tubeGeometry } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    
    const midPoint = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    midPoint.x += (Math.random() - 0.5) * 0.3;
    midPoint.z += (Math.random() - 0.5) * 0.3;
    
    const curvePoints = [s, midPoint, e];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    let thickness = 0.02;
    if (type === 'power') thickness = 0.04;
    if (type === 'data') thickness = 0.015;
    if (type === 'control') thickness = 0.01;
    
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, thickness, 8, false);
    
    return { curve, tubeGeometry };
  }, [start, end, type]);

  const emissiveIntensity = useMemo(() => {
    if (!isActive) return 0;
    if (type === 'power') return 0.8;
    if (type === 'data') return 1.2;
    return 0.5;
  }, [isActive, type]);

  if (isBroken) {
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;
    
    return (
      <group>
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial 
            color="#333333"
            transparent
            opacity={0.3}
          />
        </mesh>
        <mesh position={[midX, midY, midZ]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? emissiveIntensity : 0}
        transparent
        opacity={isActive ? 0.9 : 0.2}
      />
    </mesh>
  );
}