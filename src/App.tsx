import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { ServerRack } from './ServerRack';
import { useServerStore } from './store';
import './App.css';

function UI() {
  const powerState = useServerStore((s) => s.powerState);
  const relayStatus = useServerStore((s) => s.relayStatus);
  const logs = useServerStore((s) => s.logs);
  const level1Power = useServerStore((s) => s.level1Power);
  const triggerAttack = useServerStore((s) => s.triggerAttack);
  const cutPower = useServerStore((s) => s.cutPower);
  const drainBattery = useServerStore((s) => s.drainBattery);
  const setPowerState = useServerStore((s) => s.setPowerState);

  const handlePowerCycle = () => {
    if (powerState === 'MAIN') {
      setPowerState('BATTERY');
    } else if (powerState === 'BATTERY') {
      drainBattery();
    } else {
      setPowerState('MAIN');
    }
  };

  return (
    <div className="ui-overlay">
      <div className="status-panel">
        <h2>SYSTEM STATUS</h2>
        <div className="status-item">
          <span className="label">Power:</span>
          <span className={`value ${powerState}`}>{powerState}</span>
        </div>
        <div className="status-item">
          <span className="label">Relay:</span>
          <span className={`value ${relayStatus}`}>{relayStatus}</span>
        </div>
        <div className="status-item">
          <span className="label">L1 Power:</span>
          <span className={`value ${level1Power ? 'ON' : 'OFF'}`}>{level1Power ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="control-panel">
        <h2>CONTROLS</h2>
        <button onClick={triggerAttack} className="btn danger">
          Inject Malware
        </button>
        <button onClick={handlePowerCycle} className="btn warning">
          {powerState === 'MAIN' ? 'Cut Main Power' : powerState === 'BATTERY' ? 'Drain Battery' : 'Restore Power'}
        </button>
        <button onClick={() => setPowerState('MAIN')} className="btn success">
          Restore Power
        </button>
      </div>

      <div className="log-panel">
        <h2>SYSTEM LOGS</h2>
        <div className="logs">
          {logs.slice(-10).reverse().map((log) => (
            <div key={log.id} className="log-entry">
              <span className="timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <Canvas>
        <PerspectiveCamera makeDefault position={[8, 8, 12]} fov={50} />
        <OrbitControls target={[0, 5, 0]} maxPolarAngle={Math.PI / 1.5} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 15, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, 5, -5]} intensity={0.5} color="#00aaff" />
        
        <fog attach="fog" args={['#050505', 10, 30]} />
        
        <ServerRack />
        
        <gridHelper args={[30, 30, '#111111', '#0a0a0a']} position={[0, -0.5, 0]} />
      </Canvas>
      <UI />
    </div>
  );
}

export default App;