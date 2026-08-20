import React from 'react';
import {
  Activity,
  Zap,
  BarChart3,
  BookOpen,
  Wifi,
  ShieldAlert,
  Cpu,
  Crosshair,
  ArrowUpRight,
  Flame,
  Gauge,
  Sparkles,
  Target,
  Smartphone,
  UserCheck,
  TrendingUp,
  Brain,
  Dumbbell,
} from 'lucide-react';
import { ScreenId, DeviceInfo, PingRecord } from '../types';
import { gamerAudio } from '../utils/audio';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
  deviceInfo: DeviceInfo;
  latestPing: PingRecord;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, deviceInfo, latestPing }) => {
  const getPingColor = (ping: number) => {
    if (ping < 35) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (ping < 65) return 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20';
    return 'text-red-400 border-red-500/40 bg-red-950/20';
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white">
      {/* Header Banner with Greeting and System Pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              PANEL PRINCIPAL
            </span>
            <span className="text-xs font-mono text-zinc-400">SENSI 33 CORE v3.0</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            CENTRO DE COMANDO GAMING
          </h2>
        </div>

        {/* Quick Diagnostics Chips */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${getPingColor(latestPing.ping)}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-ping" />
            <span>PING: {latestPing.ping}ms</span>
          </div>
          <div className="px-3 py-1 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-red-500" />
            <span>{deviceInfo.refreshRate} • 240Hz TÁCTIL</span>
          </div>
        </div>
      </div>

      {/* Hero Module Banner: CENTRO DE ENTRENAMIENTO & CALIBRADOR */}
      <div className="my-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-zinc-900/90 to-zinc-950 border border-red-500/40 relative overflow-hidden shadow-[0_0_25px_rgba(255,30,39,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="absolute top-0 right-0 w-48 h-full bg-red-600/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_15px_rgba(255,30,39,0.6)] flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] font-bold">
                NUEVO MÓDULO
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">CENTRO DE ENTRENAMIENTO SENSI 33</span>
            </div>
            <h3 className="text-sm sm:text-base font-black italic text-white tracking-tight">
              FLICK • REACCIÓN • PRECISIÓN • CONSISTENCIA & RUTINAS
            </h3>
            <p className="text-[11px] text-zinc-400 max-w-xl">
              Pruebas tácticas interactivas con ranking competitivo (S+ a C), diagnóstico en tiempo real y rutinas de 5, 10 y 15 min.
            </p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            id="btn-hero-training-center"
            onClick={() => {
              gamerAudio.playSelect();
              onNavigate('training');
            }}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,30,39,0.5)] flex items-center gap-1.5 cursor-pointer group"
          >
            <Target className="w-3.5 h-3.5" />
            <span>ENTRENAR AHORA</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            id="btn-hero-smart-calibrator"
            onClick={() => {
              gamerAudio.playSelect();
              onNavigate('calibrator');
            }}
            className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-red-400 font-mono text-xs font-bold border border-red-500/40 hover:border-red-400 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CALIBRADOR</span>
          </button>

          <button
            id="btn-hero-adaptive-profile"
            onClick={() => {
              gamerAudio.playSelect();
              onNavigate('adaptive');
            }}
            className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>PERFIL</span>
          </button>

          <button
            id="btn-hero-evolution-mode"
            onClick={() => {
              gamerAudio.playSelect();
              onNavigate('evolution');
            }}
            className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 font-mono text-xs font-bold border border-amber-500/40 hover:border-amber-400 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>EVOLUCIÓN</span>
          </button>
        </div>
      </div>

      {/* Bento Grid: Core Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2.5 flex-1">
        {/* Module 1: Centro de Entrenamiento */}
        <button
          id="btn-nav-training-center"
          onClick={() => {
            gamerAudio.playSelect();
            onNavigate('training');
          }}
          className="group relative p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-red-500/40 hover:border-red-500/80 transition-all text-left flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/15 rounded-full blur-xl group-hover:bg-red-600/25 transition duration-300" />
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">
              4 MÓDULOS
            </span>
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center gap-1.5">
              CENTRO DE ENTRENAMIENTO
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
              Flick, Reacción pura, Precisión progresiva, Consistencia y Rutinas 5/10/15 min.
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Rango S+ a C • Récords</span>
            <span className="text-red-400 font-bold">ENTRENAR →</span>
          </div>
        </button>

        {/* Module 2: Configuración de Sensibilidad */}
        <button
          id="btn-nav-sensi"
          onClick={() => {
            gamerAudio.playSelect();
            onNavigate('sensi');
          }}
          className="group relative p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-red-500/50 transition-all text-left flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition duration-300" />
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              ESCALA 0–200
            </span>
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
              SENSIBILIDAD POR ARMA
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
              Calibración oficial 0–200 para escopetas, SMG, AR y francotiradores según iPhone.
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Escala 0–200 • Presets Pro</span>
            <span className="text-red-400 font-bold">CALCULAR →</span>
          </div>
        </button>

        {/* Module 3: Diagnóstico de Red & Ping */}
        <button
          id="btn-nav-network"
          onClick={() => {
            gamerAudio.playSelect();
            onNavigate('network');
          }}
          className="group relative p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-red-500/50 transition-all text-left flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition duration-300" />
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              RADAR LIVE
            </span>
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
              DIAGNÓSTICO & PING
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
              Latencia continua, detección de jitter, pérdida de paquetes y radar regional.
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Ping actual: {latestPing.ping}ms</span>
            <span className="text-red-400 font-bold">ABRIR →</span>
          </div>
        </button>

        {/* Module 4: Simulador de HUD & Botones */}
        <button
          id="btn-nav-hud"
          onClick={() => {
            gamerAudio.playSelect();
            onNavigate('hud');
          }}
          className="group relative p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-red-500/50 transition-all text-left flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition duration-300" />
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500 group-hover:scale-110 transition-transform">
              <Crosshair className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              2, 3 & 4 DEDOS
            </span>
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
              SIMULADOR DE HUD
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
              Ubica y calcula coordenadas exactas (% X, % Y) de disparo y pared Gloo.
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Presets táctiles Pro</span>
            <span className="text-red-400 font-bold">DISEÑAR →</span>
          </div>
        </button>

        {/* Module 5: Estadísticas & Sesiones */}
        <button
          id="btn-nav-stats"
          onClick={() => {
            gamerAudio.playSelect();
            onNavigate('stats');
          }}
          className="group relative p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-red-500/50 transition-all text-left flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition duration-300" />
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              HISTORIAL
            </span>
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
              ESTADÍSTICAS & SESIONES
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
              Historial de partidas, seguimiento de estabilidad y control térmico.
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Estabilidad: 94.8%</span>
            <span className="text-red-400 font-bold">MÉTRICAS →</span>
          </div>
        </button>

        {/* Module 6: Guía de Rendimiento iOS */}
        <button
          id="btn-nav-guide"
          onClick={() => {
            gamerAudio.playSelect();
            onNavigate('guide');
          }}
          className="group relative p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-red-500/50 transition-all text-left flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl group-hover:bg-red-600/20 transition duration-300" />
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              TUTORIALES
            </span>
          </div>

          <div className="mt-2">
            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
              GUÍA DE RENDIMIENTO
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
              Configuración de AssistiveTouch, Modo Juego iOS 18 y anti-throttling.
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>100% Legal & Seguro</span>
            <span className="text-red-400 font-bold">LEER →</span>
          </div>
        </button>
      </div>

      {/* Footer System Info Strip */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>SENSI 33 OPERATIVO • {deviceInfo.model}</span>
        </div>
        <span className="hidden sm:inline">ORIENTACIÓN HORIZONTAL GAMING</span>
      </div>
    </div>
  );
};

