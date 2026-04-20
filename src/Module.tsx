import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Torus, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useServerStore } from './store';

interface ModuleProps {
  id: string;
  type: string;
  subtype?: string;
  position: [number, number, number];
  isPowered: boolean;
  status?: 'normal' | 'warning' | 'danger';
}

export function Module({ id, type, subtype, position, isPowered, status = 'normal' }: ModuleProps) {
  const meshRef = useRef<THREE.Group>(null);
  const powerState = useServerStore((s) => s.powerState);
  const relayStatus = useServerStore((s) => s.relayStatus);
  
  const emissiveColor = useMemo(() => {
    if (!isPowered) return new THREE.Color('#111111');
    if (status === 'danger') return new THREE.Color('#ff0000');
    if (status === 'warning') return new THREE.Color('#ffaa00');
    return new THREE.Color('#00ff88');
  }, [isPowered, status]);

  const baseMaterial = useMemo(() => (
    <meshStandardMaterial 
      color={isPowered ? '#1a1a2e' : '#0a0a0a'} 
      emissive={emissiveColor}
      emissiveIntensity={isPowered ? 0.5 : 0}
      transparent
      opacity={0.9}
    />
  ), [isPowered, emissiveColor]);

  const handleType = () => {
    switch (type) {
      case 'LiFePO4_Bank':
        return (
          <group>
            <Box args={[0.6, 1.2, 0.4]} position={[0, 0.6, 0]}>
              <meshStandardMaterial color="#0a1628" emissive={isPowered ? '#0066ff' : '#000011'} emissiveIntensity={isPowered ? 0.8 : 0} />
            </Box>
            {[0.2, 0.6, 1.0].map((y, i) => (
              <Box key={i} args={[0.5, 0.15, 0.35]} position={[0, y, 0.02]}>
                <meshStandardMaterial color="#0033aa" emissive="#0088ff" emissiveIntensity={isPowered ? 0.6 : 0} />
              </Box>
            ))}
            <Text position={[0, 1.4, 0]} fontSize={0.15} color="#00aaff">LiFePO4</Text>
          </group>
        );

      case 'Generator':
        const isHydrogen = subtype === 'Hydrogen';
        return (
          <group>
            <Cylinder args={[0.4, 0.5, 1.2, 16]} position={[0, 0.6, 0]}>
              <meshStandardMaterial color={isHydrogen ? '#1a1a1a' : '#2a2a2a'} metalness={0.8} roughness={0.2} />
            </Cylinder>
            {isHydrogen ? (
              <Torus args={[0.3, 0.05, 8, 32]} position={[0, 1.2, 0]}>
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={isPowered ? 1 : 0} />
              </Torus>
            ) : (
              <Box args={[0.8, 0.3, 0.3]} position={[0, 1.2, 0.3]}>
                <meshStandardMaterial color="#444444" metalness={0.9} />
              </Box>
            )}
            <Text position={[0, 1.5, 0]} fontSize={0.12} color={isHydrogen ? '#00ffff' : '#ff8800'}>
              {isHydrogen ? 'H2' : 'DIESEL'}
            </Text>
          </group>
        );

      case 'ATS_Switch':
        return (
          <group>
            <Box args={[0.5, 0.8, 0.3]} position={[0, 0.4, 0]}>
              <meshStandardMaterial color="#1a1a1a" />
            </Box>
            <Box args={[0.3, 0.15, 0.05]} position={[0, 0.4, 0.15]}>
              <meshStandardMaterial 
                color={powerState === 'MAIN' ? '#00ff00' : powerState === 'BATTERY' ? '#ffaa00' : '#ff0000'}
                emissive={powerState === 'MAIN' ? '#00ff00' : powerState === 'BATTERY' ? '#ffaa00' : '#ff0000'}
                emissiveIntensity={1}
              />
            </Box>
            <Text position={[0, 1.0, 0]} fontSize={0.1} color="#ffffff">ATS</Text>
          </group>
        );

      case 'Input_Gateway':
      case 'Threat_Lab':
      case 'Clean_Zone':
      case 'Outbound_Control':
        return (
          <group>
            <Box args={[0.8, 0.6, 0.4]} position={[0, 0.3, 0]}>
              {baseMaterial}
            </Box>
            <Box args={[0.6, 0.4, 0.05]} position={[0, 0.3, 0.22]}>
              <meshStandardMaterial 
                color={type === 'Threat_Lab' && status === 'danger' ? '#ff0000' : '#001133'}
                emissive={type === 'Threat_Lab' && status === 'danger' ? '#ff0000' : '#00aaff'}
                emissiveIntensity={isPowered ? 0.8 : 0.1}
              />
            </Box>
            <Text position={[0, 0.7, 0]} fontSize={0.1} color="#88ccff">
              {type.replace('_', ' ')}
            </Text>
          </group>
        );

      case 'Master_Relay':
        const isOpen = relayStatus === 'OPEN';
        return (
          <group ref={meshRef}>
            <Box args={[0.8, 0.6, 0.5]} position={[0, 0.3, 0]}>
              <meshStandardMaterial color="#2a2a2a" metalness={0.7} />
            </Box>
            <Box 
              args={[0.1, 0.4, 0.05]} 
              position={[isOpen ? 0.2 : 0, 0.3, 0.28]}
              rotation={[0, 0, isOpen ? -0.5 : 0]}
            >
              <meshStandardMaterial color="#888888" metalness={0.9} />
            </Box>
            <Sphere args={[0.08, 16, 16]} position={[0.15, 0.5, 0.28]}>
              <meshStandardMaterial 
                color={isOpen ? '#ff0000' : '#00ff00'}
                emissive={isOpen ? '#ff0000' : '#00ff00'}
                emissiveIntensity={1}
              />
            </Sphere>
            <Text position={[0, 0.7, 0]} fontSize={0.12} color={isOpen ? '#ff0000' : '#00ff00'}>
              RELAY
            </Text>
          </group>
        );

      case 'Heartbeat_Monitor':
      case 'Diagnostics':
      case 'Aggregator':
        return (
          <group>
            <Box args={[0.6, 0.5, 0.3]} position={[0, 0.25, 0]}>
              {baseMaterial}
            </Box>
            <Box args={[0.4, 0.3, 0.05]} position={[0, 0.25, 0.18]}>
              <meshStandardMaterial color="#001122" emissive="#00ffcc" emissiveIntensity={isPowered ? 0.5 : 0} />
            </Box>
            <Text position={[0, 0.55, 0]} fontSize={0.08} color="#00ffcc">{type}</Text>
          </group>
        );

      case 'Smart_PDU':
      case 'Climate_Controller':
      case 'Resource_Arbiter':
        return (
          <group>
            <Box args={[0.6, 0.8, 0.4]} position={[0, 0.4, 0]}>
              {baseMaterial}
            </Box>
            {[0.2, 0.4, 0.6].map((y, i) => (
              <Box key={i} args={[0.1, 0.1, 0.05]} position={[-0.2, y, 0.22]}>
                <meshStandardMaterial 
                  color={i === 0 ? '#00ff00' : '#ffaa00'}
                  emissive={i === 0 ? '#00ff00' : '#ffaa00'}
                  emissiveIntensity={isPowered ? 0.8 : 0}
                />
              </Box>
            ))}
            <Text position={[0, 1.0, 0]} fontSize={0.1} color="#ffffff">{type.replace('_', ' ')}</Text>
          </group>
        );

      case 'Admin_Terminal_Port':
        return (
          <group>
            <Box args={[0.5, 0.3, 0.3]} position={[0, 0.15, 0]}>
              <meshStandardMaterial color="#1a1a1a" />
            </Box>
            <Box args={[0.4, 0.2, 0.05]} position={[0, 0.15, 0.18]}>
              <meshStandardMaterial 
                color="#000000"
                emissive="#ff8800"
                emissiveIntensity={isPowered ? 0.3 : 0}
              />
            </Box>
            <Text position={[0, 0.4, 0]} fontSize={0.08} color="#ff8800">ADMIN</Text>
          </group>
        );

      case 'Super_Capacitor_Bank':
        const isCapacitorActive = powerState === 'CAPACITOR';
        return (
          <group>
            <Box args={[0.5, 0.6, 0.3]} position={[0, 0.3, 0]}>
              <meshStandardMaterial 
                color="#1a1a1a"
                emissive={isCapacitorActive ? '#00aaff' : '#001122'}
                emissiveIntensity={isCapacitorActive ? 1 : 0.1}
              />
            </Box>
            <Sphere args={[0.15, 16, 16]} position={[0, 0.3, 0.2]}>
              <meshStandardMaterial 
                color="#00aaff"
                emissive="#00aaff"
                emissiveIntensity={isCapacitorActive ? 2 : 0.2}
                transparent
                opacity={0.8}
              />
            </Sphere>
            <Text position={[0, 0.7, 0]} fontSize={0.1} color="#00aaff">CAP</Text>
          </group>
        );

      case 'Unified_Buffer':
      case 'Policy_Engine':
      case 'Container_Factory':
        return (
          <group>
            <Box args={[0.7, 0.5, 0.4]} position={[0, 0.25, 0]}>
              {baseMaterial}
            </Box>
            <Box args={[0.5, 0.35, 0.05]} position={[0, 0.25, 0.23]}>
              <meshStandardMaterial color="#000011" emissive="#aa00ff" emissiveIntensity={isPowered ? 0.6 : 0.1} />
            </Box>
            <Text position={[0, 0.55, 0]} fontSize={0.1} color="#aa00ff">{type.replace('_', ' ')}</Text>
          </group>
        );

      case 'Split_Transport_Part_A':
        return (
          <group>
            <Cylinder args={[0.25, 0.25, 0.4, 16]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#003366" emissive="#00aaff" emissiveIntensity={isPowered ? 0.5 : 0} />
            </Cylinder>
            <Text position={[0, 0.5, 0]} fontSize={0.1} color="#00aaff">IN</Text>
          </group>
        );

      case 'Split_Transport_Part_B':
        return (
          <group>
            <Cylinder args={[0.25, 0.25, 0.4, 16]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#330066" emissive="#aa00ff" emissiveIntensity={isPowered ? 0.5 : 0} />
            </Cylinder>
            <Text position={[0, 0.5, 0]} fontSize={0.1} color="#aa00ff">OUT</Text>
          </group>
        );

      case 'Audit_Box':
        return (
          <group>
            <Box args={[0.3, 0.4, 0.2]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#0a1a0a" emissive="#00ff00" emissiveIntensity={isPowered ? 0.4 : 0.1} />
            </Box>
            <Text position={[0, 0.5, 0]} fontSize={0.08} color="#00ff00">AUDIT</Text>
          </group>
        );

      default:
        return (
          <group>
            <Box args={[0.5, 0.5, 0.5]} position={[0, 0.25, 0]}>
              {baseMaterial}
            </Box>
            <Text position={[0, 0.55, 0]} fontSize={0.1} color="#ffffff">{type}</Text>
          </group>
        );
    }
  };

  return (
    <group position={position}>
      {handleType()}
    </group>
  );
}