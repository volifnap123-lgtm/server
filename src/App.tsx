import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { ServerCube } from './ServerCube';
import { DataPacket } from './Packet';
import { useServerStore } from './store';
import './App.css';

function PacketController() {
  const dataPackets = useServerStore((s) => s.dataPackets);
  const updatePackets = useServerStore((s) => s.updatePackets);
  const setSectorStatus = useServerStore((s) => s.setSectorStatus);
  const addLog = useServerStore((s) => s.addLog);
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  
  useFrame(() => {
    updatePackets();
    
    dataPackets.forEach(packet => {
      if (packet.type === 'MALWARE') {
        if (packet.progress > 0.5 && packet.progress < 0.55 && sectorStatus[0] === 'GREEN') {
          setSectorStatus(0, 'RED');
          addLog('THREAT DETECTED in Sector 1!', 'alert');
        }
        if (packet.progress > 0.7 && packet.progress < 0.75 && sectorStatus[0] === 'RED') {
          setSectorStatus(0, 'OFFLINE');
          addLog('Sector 1 ISOLATED due to threat.', 'alert');
        }
      }
    });
  });
  
  return null;
}

function UI() {
  const power = useServerStore((s) => s.power);
  const batteryLevel = useServerStore((s) => s.batteryLevel);
  const generatorFuel = useServerStore((s) => s.generatorFuel);
  const gridActive = useServerStore((s) => s.gridActive);
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  const logs = useServerStore((s) => s.logs);
  const maintenanceMode = useServerStore((s) => s.maintenanceMode);
  const alarmActive = useServerStore((s) => s.alarmActive);
  const pcmTemp = useServerStore((s) => s.pcmTemp);
  const viewMode = useServerStore((s) => s.viewMode);
  
  const setGridActive = useServerStore((s) => s.setGridActive);
  const setViewMode = useServerStore((s) => s.setViewMode);
  const setMaintenanceMode = useServerStore((s) => s.setMaintenanceMode);
  const triggerAttack = useServerStore((s) => s.triggerAttack);
  const setLockdown = useServerStore((s) => s.setLockdown);
  const triggerAlarm = useServerStore((s) => s.triggerAlarm);
  const resetSystem = useServerStore((s) => s.resetSystem);
  const addLog = useServerStore((s) => s.addLog);

  const getPowerLabel = () => {
    switch (power) {
      case 'GRID': return 'GRID (Сеть)';
      case 'BATTERY': return 'BATTERY (Батарея)';
      case 'GENERATOR': return 'GENERATOR (Генератор)';
      case 'CAPACITOR': return 'CAPACITOR (Конденсатор)';
      case 'OFF': return 'OFF (Выключен)';
    }
  };

  return (
    <div className="ui">
      <div className="header">
        <h1>BASTION-CHRONOS</h1>
        <p>Industrial Security Server Digital Twin</p>
        {alarmActive && <div className="alarm-banner">⚠️ ALARM: PHYSICAL BREACH DETECTED</div>}
      </div>

      <div className="status-panel">
        <h2>SYSTEM STATUS</h2>
        
        <div className="status-grid">
          <div className="status-item">
            <span>Power Source</span>
            <span className={`value ${power}`}>{getPowerLabel()}</span>
          </div>
          <div className="status-item">
            <span>Battery</span>
            <span className="value">{batteryLevel}%</span>
          </div>
          <div className="status-item">
            <span>Grid</span>
            <span className={`value ${gridActive ? 'green' : 'red'}`}>{gridActive ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="status-item">
            <span>PCM Temp</span>
            <span className={`value ${pcmTemp > 50 ? 'red' : 'green'}`}>{pcmTemp.toFixed(1)}°C</span>
          </div>
        </div>

        <h3>SECTOR STATUS</h3>
        <div className="sector-grid">
          {sectorStatus.map((status, i) => (
            <div key={i} className={`sector ${status}`}>
              S{i + 1}: {status}
            </div>
          ))}
        </div>

        <h3>GENERATORS</h3>
        <div className="gen-grid">
          {generatorFuel.map((fuel, i) => (
            <div key={i} className="gen-item">
              H2 #{i + 1}: {fuel}%
            </div>
          ))}
        </div>
      </div>

      <div className="control-panel">
        <h2>CONTROLS</h2>
        
        <div className="control-section">
          <h3>SIMULATIONS</h3>
          <button className="btn danger" onClick={() => triggerAttack('MALWARE')}>
            Inject Malware
            <span>Моделировать Атаку</span>
          </button>
          <button className="btn warning" onClick={() => {
            setGridActive(false);
            addLog('GRID FAILURE! Switching to battery...', 'alert');
          }}>
            Simulate Grid Fail
            <span>Отключить Сеть</span>
          </button>
          <button className="btn warning" onClick={() => {
            triggerAlarm(true);
            setLockdown(true);
          }}>
            Trigger Breach
            <span>Проникновение</span>
          </button>
        </div>

        <div className="control-section">
          <h3>MODE</h3>
          <button className={`btn ${maintenanceMode ? 'active' : ''}`} onClick={() => setMaintenanceMode(!maintenanceMode)}>
            {maintenanceMode ? '🔧 Maintenance ON' : 'Maintenance OFF'}
            <span>Режим Обслуживания</span>
          </button>
          <button className="btn" onClick={() => setViewMode(viewMode === 'XRAY' ? 'PHYSICAL' : 'XRAY')}>
            {viewMode === 'XRAY' ? 'X-Ray ON' : 'X-Ray OFF'}
            <span>Рентген Режим</span>
          </button>
        </div>

        <div className="control-section">
          <h3>SYSTEM</h3>
          <button className="btn success" onClick={resetSystem}>
            Reset System
            <span>Перезагрузка</span>
          </button>
        </div>
      </div>

      <div className="log-panel">
        <h2>SYSTEM LOGS</h2>
        <div className="logs">
          {logs.slice(-12).reverse().map((log) => (
            <div key={log.id} className={`log-entry ${log.level}`}>
              <span className="time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="msg">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="log-entry info">
              <span className="msg">System initialized. Ready.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const dataPackets = useServerStore((s) => s.dataPackets);
  const alarmActive = useServerStore((s) => s.alarmActive);

  return (
    <div className="app">
      <Canvas>
        <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={45} />
        <OrbitControls 
          target={[0, 0, 0]} 
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          minDistance={2}
          maxDistance={8}
        />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-3, 2, -3]} intensity={0.4} color="#00aaff" />
        
        {alarmActive && <AnimatedAlarmLight />}
        
        <fog attach="fog" args={['#050505', 8, 20]} />
        <Stars radius={30} depth={50} count={1500} factor={4} saturation={0} fade speed={0.5} />
        
        <ServerCube />
        
        <PacketController />
        
        {dataPackets.map((packet) => (
          <DataPacket
            key={packet.id}
            progress={packet.progress}
            type={packet.type as 'CLEAN' | 'MALWARE' | 'ENCRYPTED'}
            from={packet.from}
            to={packet.to}
          />
        ))}
        
        <Grid 
          args={[15, 15]} 
          position={[0, -1.1, 0]} 
          cellSize={0.3}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={1.5}
          sectionThickness={1}
          sectionColor="#00ff88"
          fadeDistance={12}
          fadeStrength={1}
        />
      </Canvas>
      <UI />
    </div>
  );
}

function AnimatedAlarmLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 10) * 1;
    }
  });
  
  return <pointLight ref={lightRef} color="#ff0000" intensity={2} distance={5} />;
}

export default App;