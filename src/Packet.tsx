import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface DataPacketProps {
  progress: number;
  type: 'CLEAN' | 'MALWARE' | 'ENCRYPTED';
  from: string;
  to: string;
}

const PACKET_PATH_POINTS = {
  'internet-buffer': [
    new THREE.Vector3(1.2, 0.8, 0),
    new THREE.Vector3(0.5, 0.7, 0),
    new THREE.Vector3(0, 0.6, 0),
  ],
  'buffer-threat': [
    new THREE.Vector3(0, 0.6, 0),
    new THREE.Vector3(-0.3, 0.4, 0),
    new THREE.Vector3(-0.5, 0.25, 0),
  ],
  'threat-clean': [
    new THREE.Vector3(-0.5, 0.25, 0),
    new THREE.Vector3(0, 0.25, 0),
    new THREE.Vector3(0.5, 0.25, 0),
  ],
  'clean-local': [
    new THREE.Vector3(0.5, 0.25, 0),
    new THREE.Vector3(0.3, -0.1, 0),
    new THREE.Vector3(0.2, -0.3, 0),
  ],
};

export function DataPacket({ progress, type, from, to }: DataPacketProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const pathKey = `${from}-${to}`;
  const curve = useMemo(() => {
    const points = PACKET_PATH_POINTS[pathKey as keyof typeof PACKET_PATH_POINTS];
    if (!points) return null;
    return new THREE.CatmullRomCurve3(points);
  }, [pathKey]);

  const position = useMemo(() => {
    if (!curve) return new THREE.Vector3(0, 0, 0);
    return curve.getPoint(progress);
  }, [curve, progress]);

  const color = type === 'MALWARE' ? '#ff0000' : type === 'ENCRYPTED' ? '#aa00ff' : '#00ff00';

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 3;
      meshRef.current.rotation.y += delta * 2;
    }
  });

  if (!curve) return null;

  return (
    <group position={position.toArray()}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.04, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight color={color} intensity={0.4} distance={0.4} />
      {type === 'MALWARE' && (
        <Html center distanceFactor={4}>
          <div style={{
            background: 'rgba(255,0,0,0.8)',
            padding: '2px 4px',
            borderRadius: '2px',
            color: '#fff',
            fontSize: '6px',
            fontFamily: 'monospace'
          }}>
            ⚠️ MALWARE
          </div>
        </Html>
      )}
    </group>
  );
}