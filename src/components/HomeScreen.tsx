import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Activity, Cpu, Wifi, Smartphone, Play, Sparkles, ChevronRight } from 'lucide-react';
import { gamerAudio } from '../utils/audio';
import { DeviceInfo } from '../types';

interface HomeScreenProps {
  onEnter: () => void;
  deviceInfo: DeviceInfo;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onEnter, deviceInfo }) => {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    gamerAudio.playBootup();
    const interval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setBootComplete(true);
          return 100;
        }
        return prev + 4;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    gamerAudio.playSelect();
    onEnter();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-8 select-none overflow-hidden bg-gradient-to-br from-zinc-950 via-[#100608] to-zinc-950 text-white">
      {/* Background Cyber Grid Lines & Glowing Aura */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff1e2710_1px,transparent_1px),linear-gradient(to_bottom,#ff1e2710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Status */}
      <div className="relative z-20 flex items-center justify-between border-b border-red-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono tracking-widest text-red-400 uppercase">
            SYSTEM STATUS: {bootComplete ? 'ONLINE // READY' : 'CALIBRATING CORE...'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800">
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
            <span className="text-zinc-200">{deviceInfo.model}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-200">{deviceInfo.connectionType}</span>
          </div>
        </div>
      </div>

      {/* Center Hero Logo & Pitch */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto text-center py-4">
        {/* Futuristic Hex Emblem / Badge */}
        <div className="relative mb-3 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-zinc-950 border-2 border-red-500/80 rounded-2xl flex flex-col items-center justify-center shadow-2xl shadow-red-900/40">
            <span className="text-xs font-black tracking-widest text-red-500 uppercase">SENSI</span>
            <span className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
              33
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase italic">
          SENSI <span className="text-red-500">33</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1 tracking-wide">
          Suite Profesional de Diagnóstico de Red, Estabilidad de Ping y Configuración de Sensibilidad Táctil para iPhone.
        </p>

        {/* 100% Fair Play Guarantee Badge */}
        <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Seguro • Sin modificaciones de archivos • Sin riesgos de baneo</span>
        </div>

        {/* Boot Progress or Enter Button */}
        <div className="mt-6 w-full max-w-md">
          {!bootComplete ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>ANALIZANDO HARDWARE TÁCTIL...</span>
                <span className="text-red-400 font-bold">{bootProgress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-100 shadow-[0_0_10px_#ff1e27]"
                  style={{ width: `${bootProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              id="btn-enter-dashboard"
              onClick={handleStart}
              className="group relative w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black tracking-wider uppercase text-sm sm:text-base flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,30,39,0.5)] active:scale-[0.98] transition cursor-pointer border border-red-400/40"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>INGRESAR AL SISTEMA</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Features Ticker / Specs Grid */}
      <div className="relative z-20 grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-zinc-900 text-left">
        <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-bold">RADAR PING</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">
            Mide latencia, jitter y pérdida de paquetes en tiempo real.
          </p>
        </div>

        <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span className="font-bold">SENSI MATRIX</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">
            Calibración de miras y botón de disparo según tu pantalla.
          </p>
        </div>

        <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-bold">STATS & FPS</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">
            Historial de sesiones y consejos de optimización iOS.
          </p>
        </div>
      </div>
    </div>
  );
};
