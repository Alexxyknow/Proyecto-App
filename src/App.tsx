import React, { useState } from 'react';
import {
  ScreenId,
  DeviceInfo,
  PingRecord,
} from './types';
import { HomeScreen } from './components/HomeScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { NetworkPingScreen } from './components/NetworkPingScreen';
import { SensiConfigScreen } from './components/SensiConfigScreen';
import { ReflexAimScreen } from './components/ReflexAimScreen';
import { SmartCalibratorScreen } from './components/SmartCalibratorScreen';
import { AdaptiveProfileScreen } from './components/AdaptiveProfileScreen';
import { EvolutionModeScreen } from './components/EvolutionModeScreen';
import { TrainingScreen } from './components/TrainingScreen';
import { HudVisualizerScreen } from './components/HudVisualizerScreen';
import { StatsScreen } from './components/StatsScreen';
import { GuidesScreen } from './components/GuidesScreen';
import { GamerSparks } from './components/GamerSparks';
import { gamerAudio } from './utils/audio';
import {
  Home,
  LayoutDashboard,
  Activity,
  Zap,
  Target,
  Crosshair,
  BarChart3,
  BookOpen,
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  Sparkles,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isIPhoneFrameMode, setIsIPhoneFrameMode] = useState<boolean>(true);

  // Device Info detected / simulated
  const [deviceInfo] = useState<DeviceInfo>({
    model: 'iPhone 15 Pro Max',
    screenSize: '6.7" Super Retina XDR OLED',
    refreshRate: '120Hz ProMotion',
    iosVersion: 'iOS 18.2',
    connectionType: 'Wi-Fi 5GHz (Ultra-Low Jitter)',
    touchSampleRate: '240Hz Touch Response',
  });

  // Current Ping Record State
  const [currentPing, setCurrentPing] = useState<PingRecord>({
    timestamp: 'Ahora',
    ping: 32,
    jitter: 2.1,
    packetLoss: 0.0,
    server: 'LATAM Norte (Miami/CDMX)',
    status: 'excelente',
  });

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    gamerAudio.enabled = newState;
    if (newState) gamerAudio.playClick();
  };

  const handleNavigate = (screen: ScreenId) => {
    gamerAudio.playSelect();
    setCurrentScreen(screen);
  };

  return (
    <div
      id="sensi-33-root"
      className="relative w-screen h-screen bg-[#07070a] text-zinc-100 flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Background Ambient Red/Dark Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,30,39,0.08)_0%,rgba(10,10,14,0.95)_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Canvas Sparks Particle Dust */}
      <GamerSparks density={50} />

      {/* Top Floating Control Bar (Sound toggle, iPhone bezel toggle, Home quick button) */}
      <header className="absolute top-3 right-4 sm:right-8 z-50 flex items-center gap-2">
        <button
          id="btn-toggle-sound"
          onClick={handleToggleSound}
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition shadow-lg backdrop-blur cursor-pointer"
          title="Sonido Gaming On/Off"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-red-500" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
        </button>

        <button
          id="btn-toggle-frame-mode"
          onClick={() => {
            gamerAudio.playClick();
            setIsIPhoneFrameMode(!isIPhoneFrameMode);
          }}
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition shadow-lg backdrop-blur flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          title="Alternar Vista Marco iPhone Horizontal"
        >
          <Smartphone className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline">{isIPhoneFrameMode ? 'Marco iPhone' : 'Pantalla Completa'}</span>
        </button>

        {currentScreen !== 'home' && (
          <button
            id="btn-quick-home"
            onClick={() => handleNavigate('home')}
            className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 transition shadow-lg backdrop-blur cursor-pointer"
            title="Pantalla de Inicio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Main Container - Landscape iPhone Chassis or Edge-to-Edge */}
      <main
        className={`relative z-30 transition-all duration-300 flex overflow-hidden ${
          isIPhoneFrameMode
            ? 'w-[96vw] max-w-[1100px] h-[90vh] max-h-[640px] rounded-[36px] border-[10px] sm:border-[12px] border-[#1f2026] bg-black shadow-[0_0_50px_rgba(255,30,39,0.25)] ring-1 ring-white/10'
            : 'w-full h-full rounded-none border-0 bg-black'
        }`}
      >
        {/* Landscape iPhone Dynamic Island */}
        {isIPhoneFrameMode && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-24 bg-black rounded-full border border-zinc-800 z-50 hidden lg:flex flex-col items-center justify-center pointer-events-none shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800 my-1" />
            <div className="w-2 h-2 rounded-full bg-blue-950/60" />
          </div>
        )}

        {/* Sidebar Horizontal Navigation Bar */}
        {currentScreen !== 'home' && (
          <nav
            aria-label="Navegación principal"
            className="w-16 sm:w-20 bg-zinc-950/95 border-r border-zinc-800/90 flex flex-col items-center justify-between py-3 z-40 relative backdrop-blur overflow-y-auto"
          >
            {/* SENSI 33 Mini Logo Badge */}
            <button
              onClick={() => handleNavigate('home')}
              className="group flex flex-col items-center cursor-pointer mb-2"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_12px_rgba(255,30,39,0.5)] group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-xs italic tracking-tighter">S33</span>
              </div>
            </button>

            {/* Navigation Tabs */}
            <div className="flex flex-col gap-2 my-auto">
              {/* Dashboard */}
              <button
                id="nav-tab-dashboard"
                onClick={() => handleNavigate('dashboard')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'dashboard'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Menú Principal"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">MENU</span>
                {currentScreen === 'dashboard' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Ping / Network */}
              <button
                id="nav-tab-network"
                onClick={() => handleNavigate('network')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'network'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Diagnóstico de Red"
              >
                <Activity className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">PING</span>
                {currentScreen === 'network' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Sensi / Armas */}
              <button
                id="nav-tab-sensi"
                onClick={() => handleNavigate('sensi')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'sensi'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Sensibilidad por Arma"
              >
                <Zap className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">SENSI</span>
                {currentScreen === 'sensi' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Calibrador Inteligente V3 */}
              <button
                id="nav-tab-calibrator"
                onClick={() => handleNavigate('calibrator')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'calibrator'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Calibrador Inteligente V3 (Flicks & Ajuste 0-200)"
              >
                <Sparkles className="w-4 h-4 text-red-400" />
                <span className="text-[8px] font-mono font-bold tracking-tight">CALIB</span>
                {currentScreen === 'calibrator' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Perfil Adaptativo V3 */}
              <button
                id="nav-tab-adaptive"
                onClick={() => handleNavigate('adaptive')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'adaptive'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Perfil Adaptativo SENSI 33 (Historial, Tendencias & Ajuste Progresivo)"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[8px] font-mono font-bold tracking-tight">PERFIL</span>
                {currentScreen === 'adaptive' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Modo Evolución SENSI 33 */}
              <button
                id="nav-tab-evolution"
                onClick={() => handleNavigate('evolution')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'evolution'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Modo Evolución SENSI 33 (Gráficas, Rachas, Objetivos & Comparativa)"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-[8px] font-mono font-bold tracking-tight">EVOL</span>
                {currentScreen === 'evolution' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Centro de Entrenamiento SENSI 33 */}
              <button
                id="nav-tab-training"
                onClick={() => handleNavigate('training')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'training'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Centro de Entrenamiento SENSI 33 (Flick, Reacción, Precisión, Consistencia & Rutinas)"
              >
                <Target className="w-4 h-4 text-red-500" />
                <span className="text-[8px] font-mono font-bold tracking-tight">TRAIN</span>
                {currentScreen === 'training' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Reflex & Levantamiento Test */}
              <button
                id="nav-tab-reflex"
                onClick={() => handleNavigate('reflex')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'reflex'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Test de Levantamiento & Reflejos"
              >
                <Crosshair className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">AIM</span>
                {currentScreen === 'reflex' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* HUD Positioner */}
              <button
                id="nav-tab-hud"
                onClick={() => handleNavigate('hud')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'hud'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Simulador de HUD & Botones"
              >
                <Crosshair className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">HUD</span>
                {currentScreen === 'hud' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Stats */}
              <button
                id="nav-tab-stats"
                onClick={() => handleNavigate('stats')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'stats'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Estadísticas de Partidas"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">STATS</span>
                {currentScreen === 'stats' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>

              {/* Guides */}
              <button
                id="nav-tab-guide"
                onClick={() => handleNavigate('guide')}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition relative group cursor-pointer ${
                  currentScreen === 'guide'
                    ? 'bg-red-600/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Guías de Optimización iOS"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-tight">GUÍA</span>
                {currentScreen === 'guide' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-r-full shadow-[0_0_8px_#ff1e27]" />
                )}
              </button>
            </div>

            {/* Bottom Status Dot */}
            <div className="flex flex-col items-center gap-0.5 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[7px] font-mono text-zinc-600">ONLINE</span>
            </div>
          </nav>
        )}

        {/* Content Viewport */}
        <div className="flex-1 h-full overflow-hidden relative bg-gradient-to-br from-zinc-950 via-[#0e0c10] to-zinc-950">
          {currentScreen === 'home' && (
            <HomeScreen
              deviceInfo={deviceInfo}
              onEnter={() => handleNavigate('dashboard')}
            />
          )}

          {currentScreen === 'dashboard' && (
            <DashboardScreen
              deviceInfo={deviceInfo}
              latestPing={currentPing}
              onNavigate={handleNavigate}
            />
          )}

          {currentScreen === 'network' && (
            <NetworkPingScreen
              currentPing={currentPing}
              onUpdatePing={setCurrentPing}
            />
          )}

          {currentScreen === 'sensi' && (
            <SensiConfigScreen deviceInfo={deviceInfo} />
          )}

          {currentScreen === 'calibrator' && (
            <SmartCalibratorScreen deviceInfo={deviceInfo} onNavigate={handleNavigate} />
          )}

          {currentScreen === 'adaptive' && (
            <AdaptiveProfileScreen deviceInfo={deviceInfo} onNavigate={handleNavigate} />
          )}

          {currentScreen === 'evolution' && (
            <EvolutionModeScreen deviceInfo={deviceInfo} onNavigate={handleNavigate} />
          )}

          {currentScreen === 'training' && (
            <TrainingScreen deviceInfo={deviceInfo} onNavigate={handleNavigate} />
          )}

          {currentScreen === 'reflex' && (
            <ReflexAimScreen />
          )}

          {currentScreen === 'hud' && (
            <HudVisualizerScreen />
          )}

          {currentScreen === 'stats' && <StatsScreen />}

          {currentScreen === 'guide' && <GuidesScreen />}
        </div>
      </main>
    </div>
  );
}
