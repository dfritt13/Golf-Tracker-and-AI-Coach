import { useState, useEffect } from 'react';
import { Trophy, BarChart3, Bot, Download } from 'lucide-react';
import ShotLogger from './components/ShotLogger';
import Dashboard from './components/Dashboard';
import AiCoach from './components/AiCoach';
import { generateSeedRounds } from './data/seedData';
import './App.css';

const TABS = [
  { id: 'logger', label: 'Shot Logger', icon: Trophy },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', icon: Bot },
];

function App() {
  const [activeTab, setActiveTab] = useState('logger');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [rounds, setRounds] = useState(() => {
    const saved = localStorage.getItem('golf-rounds');
    if (saved) return JSON.parse(saved);
    return generateSeedRounds();
  });

  useEffect(() => {
    localStorage.setItem('golf-rounds', JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function handleAddRound(round) {
    setRounds(prev => [...prev, round]);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo-icon">⛳</span>
          <h1>Golf Tracker</h1>
        </div>
        <span className="header-subtitle">AI-Powered Golf Coach</span>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'logger' && <ShotLogger rounds={rounds} onAddRound={handleAddRound} />}
        {activeTab === 'dashboard' && <Dashboard rounds={rounds} />}
        {activeTab === 'coach' && <AiCoach rounds={rounds} />}
      </main>

      {installPrompt && (
        <div className="pwa-install-banner visible">
          <span>Install Golf Tracker for quick access on your home screen</span>
          <button className="btn btn-primary" onClick={handleInstall}>
            <Download size={16} /> Install
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
