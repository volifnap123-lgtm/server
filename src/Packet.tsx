import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PacketProps {
  pathProgress: number;
  type: 'CLEAN' | 'MALWARE' | 'ENCRYPTED';
  sourceLevel: number;
  targetLevel: number;
}

export function Packet({ pathProgress, type, sourceLevel, targetLevel }: PacketProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const startPos = useMemo(() => {
    return new THREE.Vector3(0, sourceLevel + 0.5, 0);
  }, [sourceLevel]);
  
  const endPos = useMemo(() => {
    return new THREE.Vector3(0, targetLevel + 0.5, 0);
  }, [targetLevel]);
  
  const curve = useMemo(() => {
    const midPoint = new THREE.Vector3(
      (startPos.x + endPos.x) / 2 + (Math.random() - 0.5) * 1.5,
      (startPos.y + endPos.y) / 2,
      (startPos.z + endPos.z) / 2 + 0.5
    );
    return new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
  }, [startPos, endPos]);

  const position = useMemo(() => {
    return curve.getPoint(pathProgress);
  }, [curve, pathProgress]);

  const color = useMemo(() => {
    switch (type) {
      case 'MALWARE': return '#ff0000';
      case 'CLEAN': return '#00ff00';
      case 'ENCRYPTED': return '#00aaff';
    }
  }, [type]);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        transparent
        opacity={0.9}
      />
      <pointLight color={color} intensity={0.5} distance={1} />
    </mesh>
  );
}