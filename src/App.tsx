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
        if (packet.progress > 0.4 && packet.progress < 0.45 && sectorStatus[0] === 'GREEN') {
          setSectorStatus(0, 'RED');
          addLog('THREAT: Malware detected in Sector 1!', 'alert');
        }
        if (packet.progress > 0.6 && packet.progress < 0.65 && sectorStatus[0] === 'RED') {
          setSectorStatus(0, 'OFFLINE');
          addLog('SECTOR: Sector 1 ISOLATED due to threat.', 'alert');
        }
      }
    });
  });
  
  return null;
}

function AnimatedAlarmLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 12) * 1.2;
    }
  });
  
  return <pointLight ref={lightRef} color="#ff0000" intensity={2} distance={6} />;
}

function UI() {
  const power = useServerStore((s) => s.power);
  const batteryLevel = useServerStore((s) => s.batteryLevel);
  const generatorFuel = useServerStore((s) => s.generatorFuel);
  const gridActive = useServerStore((s) => s.gridActive);
  const gridVoltage = useServerStore((s) => s.gridVoltage);
  const sectorStatus = useServerStore((s) => s.sectorStatus);
  const logs = useServerStore((s) => s.logs);
  const viewMode = useServerStore((s) => s.viewMode);
  const maintenanceMode = useServerStore((s) => s.maintenanceMode);
  const authenticated = useServerStore((s) => s.authenticated);
  const alarmActive = useServerStore((s) => s.alarmActive);
  const pcmTemp = useServerStore((s) => s.pcmTemp);
  const selectedModule = useServerStore((s) => s.selectedModule);
  const moduleSpecs = useServerStore((s) => s.moduleSpecs);
  
  const setGridActive = useServerStore((s) => s.setGridActive);
  const setViewMode = useServerStore((s) => s.setViewMode);
  const authenticate = useServerStore((s) => s.authenticate);
  const logout = useServerStore((s) => s.logout);
  const triggerAttack = useServerStore((s) => s.triggerAttack);
  const setLockdown = useServerStore((s) => s.setLockdown);
  const triggerAlarm = useServerStore((s) => s.triggerAlarm);
  const resetSystem = useServerStore((s) => s.resetSystem);

  const getPowerLabel = () => {
    switch (power) {
      case 'GRID': return 'GRID (Сеть)';
      case 'BATTERY': return 'BATTERY (Батарея)';
      case 'GENERATOR': return 'GENERATOR (Генератор)';
      case 'CAPACITOR': return 'CAPACITOR (Конденсатор)';
      case 'OFF': return 'OFF (Выключен)';
    }
  };

  const selectedSpec = selectedModule ? moduleSpecs[selectedModule] : null;

  return (
    <div className="ui">
      <div className="header">
        <h1>BASTION-CHRONOS</h1>
        <p>INDUSTRIAL SECURITY SERVER DIGITAL TWIN</p>
        {alarmActive && <div className="alarm-banner">⚠️ ALARM: PHYSICAL BREACH DETECTED</div>}
      </div>

      <div className="status-panel">
        <h2>SYSTEM STATUS</h2>
        
        <div className="status-grid">
          <div className="status-item">
            <label>Power Source</label>
            <span className={`value ${power}`}>{getPowerLabel()}</span>
          </div>
          <div className="status-item">
            <label>Grid Voltage</label>
            <span className={`value ${gridActive ? 'green' : 'red'}`}>
              {gridActive ? `${gridVoltage}V` : 'OFFLINE'}
            </span>
          </div>
          <div className="status-item">
            <label>Battery Level</label>
            <span className="value" style={{color: batteryLevel > 50 ? '#00aaff' : batteryLevel > 20 ? '#ffaa00' : '#ff3333'}}>
              {batteryLevel}%
            </span>
            <div className="value-bar">
              <div className="value-bar-fill" style={{width: `${batteryLevel}%`, background: batteryLevel > 50 ? '#00aaff' : batteryLevel > 20 ? '#ffaa00' : '#ff3333'}} />
            </div>
          </div>
          <div className="status-item">
            <label>PCM Temp</label>
            <span className={`value ${pcmTemp > 50 ? 'red' : 'green'}`}>{pcmTemp.toFixed(1)}°C</span>
            <div className="value-bar">
              <div className="value-bar-fill" style={{width: `${Math.min(100, pcmTemp)}%`, background: pcmTemp > 50 ? '#ff3333' : '#00ff88'}} />
            </div>
          </div>
        </div>

        <h3>POWER GENERATORS</h3>
        <div className="progress-grid">
          {generatorFuel.map((fuel, i) => (
            <div key={i} className="progress-item">
              <span className="label">H2 #{i+1}</span>
              <span className="value" style={{color: fuel > 50 ? '#00ffff' : fuel > 20 ? '#ffaa00' : '#ff3333'}}>{fuel}%</span>
            </div>
          ))}
        </div>

        <h3>SECTOR STATUS</h3>
        <div className="sector-grid">
          {sectorStatus.map((status, i) => (
            <div key={i} className={`sector ${status}`}>
              S{i+1}
            </div>
          ))}
        </div>

        {selectedSpec && (
          <div className="module-detail">
            <div className="name">{selectedSpec.name}</div>
            <div style={{color: '#88aaff', fontSize: '10px'}}>{selectedSpec.nameRu}</div>
            <div className="specs">
              <div className="spec">
                <span className="spec-label">Status</span>
                <span className="spec-value" style={{color: selectedSpec.status === 'active' ? '#00ff88' : selectedSpec.status === 'error' ? '#ff3333' : '#aaa'}}>
                  {selectedSpec.status.toUpperCase()}
                </span>
              </div>
              <div className="spec">
                <span className="spec-label">Temp</span>
                <span className="spec-value" style={{color: selectedSpec.temp > 50 ? '#ff3333' : '#aaa'}}>
                  {selectedSpec.temp}°C
                </span>
              </div>
              <div className="spec">
                <span className="spec-label">Voltage</span>
                <span className="spec-value">{selectedSpec.voltage}V</span>
              </div>
              <div className="spec">
                <span className="spec-label">State</span>
                <span className="spec-value" style={{color: '#88aaff'}}>{selectedSpec.drawerState}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="control-panel">
        <h2>CONTROLS</h2>
        
        <h3>ATTACK SIMULATIONS</h3>
        <div className="button-grid">
          <button className="btn danger" onClick={() => triggerAttack('MALWARE')}>
            💉 Inject Malware
            <span>Моделировать Атаку</span>
          </button>
          <button className="btn warning" onClick={() => {
            setGridActive(false);
          }}>
            ⚡ Simulate Grid Fail
            <span>Отключить Сеть</span>
          </button>
          <button className="btn warning" onClick={() => {
            triggerAlarm(true);
            setLockdown(true);
          }}>
            🚨 Trigger Breach
            <span>Проникновение</span>
          </button>
        </div>

        <h3>VIEW MODES</h3>
        <div className="btn-group">
          <button className={`btn ${viewMode === 'XRAY' ? 'active' : ''}`} onClick={() => setViewMode(viewMode === 'XRAY' ? 'PHYSICAL' : 'XRAY')}>
            {viewMode === 'XRAY' ? '✅ X-Ray ON' : '❌ X-Ray OFF'}
          </button>
          <button className={`btn ${maintenanceMode ? 'active' : ''}`} onClick={() => {
            if (authenticated) {
              logout();
            } else {
              const ok = authenticate('admin123');
              if (!ok) alert('Password: admin123');
            }
          }}>
            {maintenanceMode ? '🔧 Maintenance ON' : '🔒 Maintenance OFF'}
          </button>
        </div>

        <h3>SYSTEM</h3>
        <div className="button-grid">
          <button className="btn success" onClick={resetSystem}>
            🔄 Reset System
            <span>Перезагрузка</span>
          </button>
        </div>
      </div>

      <div className="log-panel">
        <h2>SYSTEM LOGS</h2>
        <div className="logs">
          {logs.slice(-20).reverse().map((log) => (
            <div key={log.id} className={`log-entry ${log.level}`}>
              <span className="time">{new Date(log.timestamp).toLocaleTimeString()}</span>
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
        <PerspectiveCamera makeDefault position={[3, 2.5, 4.5]} fov={45} />
        <OrbitControls 
          target={[0, 0, 0]} 
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={2}
          maxDistance={10}
        />
        
        <ambientLight intensity={0.35} />
        <pointLight position={[6, 6, 6]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-4, 3, -4]} intensity={0.5} color="#00aaff" />
        <pointLight position={[0, -2, 4]} intensity={0.3} color="#ff6600" />
        
        {alarmActive && <AnimatedAlarmLight />}
        
        <fog attach="fog" args={['#0a0a10', 6, 18]} />
        <Stars radius={40} depth={50} count={2000} factor={4} saturation={0} fade speed={0.4} />
        
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
          args={[20, 20]} 
          position={[0, -1.2, 0]} 
          cellSize={0.25}
          cellThickness={0.5}
          cellColor="#1a1a2a"
          sectionSize={1.5}
          sectionThickness={1}
          sectionColor="#00ff88"
          fadeDistance={15}
          fadeStrength={1}
        />
      </Canvas>
      <UI />
    </div>
  );
}

export default App;