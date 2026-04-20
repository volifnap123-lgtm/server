import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Module } from './Module';
import { Cable } from './Cable';
import { Packet } from './Packet';
import { useServerStore } from './store';

export function ServerRack() {
  const groupRef = useRef<THREE.Group>(null);
  const serverConfig = useServerStore((s) => s.serverConfig);
  const powerState = useServerStore((s) => s.powerState);
  const relayStatus = useServerStore((s) => s.relayStatus);
  const level1Power = useServerStore((s) => s.level1Power);
  const dataPackets = useServerStore((s) => s.dataPackets);
  const updatePackets = useServerStore((s) => s.updatePackets);
  const triggerAttack = useServerStore((s) => s.triggerAttack);
  const cutPower = useServerStore((s) => s.cutPower);
  const restoreRelay = useServerStore((s) => s.restoreRelay);

  useFrame(() => {
    updatePackets();
  });

  useEffect(() => {
    const handlePacketArrival = () => {
      const malwarePackets = dataPackets.filter(p => p.type === 'MALWARE' && p.pathProgress >= 0.9);
      if (malwarePackets.length > 0) {
        useServerStore.getState().setRelayStatus('OPEN');
        useServerStore.getState().addLog('LEVEL 2: THREAT CONFIRMED. RELAY TRIPPED. LEVEL 1 ISOLATED.');
        setTimeout(() => {
          restoreRelay();
        }, 15000);
      }
    };
    
    const interval = setInterval(handlePacketArrival, 100);
    return () => clearInterval(interval);
  }, [dataPackets, restoreRelay]);

  const levelModules = useMemo(() => {
    const modules: Record<number, typeof serverConfig.levels[0]['modules']> = {};
    serverConfig.levels.forEach((level) => {
      modules[level.level] = level.modules;
    });
    return modules;
  }, [serverConfig]);

  const isLevelPowered = (level: number) => {
    if (level === 0) return powerState !== 'OFF';
    if (level === 1) return level1Power && powerState !== 'OFF';
    if (level === 2) return powerState !== 'OFF';
    if (level === 3) return powerState !== 'OFF';
    if (level === 4) return powerState !== 'OFF';
    return false;
  };

  const getModuleStatus = (moduleId: string, level: number): 'normal' | 'warning' | 'danger' => {
    if (moduleId === 'threat_lab' && level1Power === false) return 'danger';
    if (moduleId === 'threat_lab' && dataPackets.some(p => p.type === 'MALWARE' && p.targetLevel === 1)) return 'danger';
    return 'normal';
  };

  const allCables = useMemo(() => {
    const cables: { start: [number, number, number]; end: [number, number, number]; color: string; type: string; broken?: boolean }[] = [];
    
    serverConfig.levels.forEach((level) => {
      level.cables.forEach((cable) => {
        const fromModule = level.modules.find(m => m.id === cable.from);
        const toModule = level.modules.find(m => m.id === cable.to);
        
        if (fromModule && toModule) {
          cables.push({
            start: [fromModule.position[0], level.height + fromModule.position[1], fromModule.position[2]],
            end: [toModule.position[0], level.height + toModule.position[1], toModule.position[2]],
            color: cable.color,
            type: cable.type,
            broken: false
          });
        }
      });
    });

    serverConfig.externalConnections?.forEach((conn) => {
      const sourceLevel = serverConfig.levels.find(l => l.modules.some(m => m.id === conn.from));
      const targetLevel = serverConfig.levels.find(l => l.modules.some(m => m.id === conn.to));
      
      if (sourceLevel && targetLevel) {
        const fromModule = sourceLevel.modules.find(m => m.id === conn.from);
        const toModule = targetLevel.modules.find(m => m.id === conn.to);
        
        if (fromModule && toModule) {
          const isBroken = conn.from === 'part_a_inbound' && !level1Power;
          
          cables.push({
            start: [fromModule.position[0], sourceLevel.height + fromModule.position[1], fromModule.position[2]],
            end: [toModule.position[0], targetLevel.height + toModule.position[1], toModule.position[2]],
            color: conn.color,
            type: conn.type,
            broken: isBroken
          });
        }
      }
    });

    const level2Cable = {
      start: [0, 5, 0] as [number, number, number],
      end: [0, 3, 0] as [number, number, number],
      color: '#ff0000',
      type: 'power',
      broken: relayStatus === 'OPEN'
    };
    cables.push(level2Cable);

    return cables;
  }, [serverConfig, level1Power, relayStatus]);

  return (
    <group ref={groupRef}>
      <Box args={[5, 10, 3]} position={[0, 5, -1]}>
        <meshStandardMaterial 
          color="#0a0a0a" 
          transparent 
          opacity={0.15} 
          side={THREE.DoubleSide}
        />
      </Box>
      
      {serverConfig.levels.map((level) => (
        <group key={level.level}>
          <Box args={[5, 0.05, 3]} position={[0, level.height, 0]}>
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} />
          </Box>
          
          {level.modules.map((module) => (
            <Module
              key={module.id}
              id={module.id}
              type={module.type}
              subtype={(module as any).subtype}
              position={[
                module.position[0],
                level.height + module.position[1],
                module.position[2]
              ]}
              isPowered={isLevelPowered(level.level)}
              status={getModuleStatus(module.id, level.level)}
            />
          ))}
        </group>
      ))}

      {allCables.map((cable, i) => (
        <Cable
          key={i}
          start={cable.start}
          end={cable.end}
          color={cable.color}
          type={cable.type as 'power' | 'data' | 'control'}
          isBroken={cable.broken}
          isActive={isLevelPowered(3)}
        />
      ))}

      {dataPackets.map((packet) => (
        <Packet
          key={packet.id}
          pathProgress={packet.pathProgress}
          type={packet.type}
          sourceLevel={packet.sourceLevel}
          targetLevel={packet.targetLevel}
        />
      ))}

      <Text position={[3, 10.5, 0]} fontSize={0.3} color="#ffffff">BASTION-CHRONOS</Text>
      <Text position={[3, 10, 0]} fontSize={0.2} color="#00ff88">Security Server</Text>
    </group>
  );
}