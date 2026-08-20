import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock, Plus, Flame, ShieldAlert, Award, Calendar, CheckCircle, Zap } from 'lucide-react';
import { GameSession } from '../types';
import { gamerAudio } from '../utils/audio';

const INITIAL_SESSIONS: GameSession[] = [
  {
    id: 'ses-1',
    date: 'Hoy, 22:45',
    gameMode: 'Duelo de Escuadras (Ranked)',
    durationMinutes: 18,
    avgPing: 32,
    maxPing: 44,
    stabilityScore: 98,
    deviceTempEstimate: 'Normal',
    notes: 'Excelente respuesta táctil, 0 tiros retrasados.',
  },
  {
    id: 'ses-2',
    date: 'Hoy, 20:15',
    gameMode: 'Battle Royale Clásico',
    durationMinutes: 24,
    avgPing: 36,
    maxPing: 52,
    stabilityScore: 94,
    deviceTempEstimate: 'Tibio',
    notes: 'Pico leve de ping en zona final, estabilidad recuperada.',
  },
  {
    id: 'ses-3',
    date: 'Ayer, 23:10',
    gameMode: 'Entrenamiento & Levantamiento de mira',
    durationMinutes: 30,
    avgPing: 29,
    maxPing: 34,
    stabilityScore: 99,
    deviceTempEstimate: 'Normal',
    notes: 'Calibración con perfil Rusher 98% de efectividad.',
  },
];

export const StatsScreen: React.FC = () => {
  const [sessions, setSessions] = useState<GameSession[]>(INITIAL_SESSIONS);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newMode, setNewMode] = useState('Duelo de Escuadras');
  const [newAvgPing, setNewAvgPing] = useState(35);
  const [newDuration, setNewDuration] = useState(15);

  const avgPingAll = Math.round(
    sessions.reduce((acc, s) => acc + s.avgPing, 0) / sessions.length
  );
  const avgStability = (
    sessions.reduce((acc, s) => acc + s.stabilityScore, 0) / sessions.length
  ).toFixed(1);

  const handleAddSession = () => {
    gamerAudio.playClick();
    const newEntry: GameSession = {
      id: `ses-${Date.now()}`,
      date: 'Justo ahora',
      gameMode: newMode,
      durationMinutes: newDuration,
      avgPing: newAvgPing,
      maxPing: newAvgPing + Math.floor(Math.random() * 12 + 4),
      stabilityScore: Math.max(88, 100 - Math.floor(newAvgPing / 5)),
      deviceTempEstimate: newDuration > 25 ? 'Tibio' : 'Normal',
      notes: 'Sesión registrada con SENSI 33 Gaming Suite.',
    };

    setSessions([newEntry, ...sessions]);
    setIsAddingSession(false);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              REGISTRO DE RENDIMIENTO
            </span>
            <span className="text-xs font-mono text-zinc-400">HISTORIAL DE PARTIDAS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            MÉTRICAS & ESTADÍSTICAS GAMING
          </h2>
        </div>

        <button
          id="btn-add-session"
          onClick={() => {
            gamerAudio.playSelect();
            setIsAddingSession(!isAddingSession);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(255,30,39,0.5)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTRAR PARTIDA</span>
        </button>
      </div>

      {/* Hero Overview 3-Box Strip */}
      <div className="grid grid-cols-3 gap-3 my-3">
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <span className="text-zinc-400 text-xs font-mono">PING HISTÓRICO MEDIO</span>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black italic text-emerald-400">
              {avgPingAll}
            </span>
            <span className="text-xs font-mono text-zinc-400 ml-1">ms</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Latencia estable</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <span className="text-zinc-400 text-xs font-mono">ESTABILIDAD GLOBAL</span>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black italic text-white">
              {avgStability}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">● Grado Competitivo</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <span className="text-zinc-400 text-xs font-mono">TOTAL PARTIDAS</span>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black italic text-red-500">
              {sessions.length}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Sesiones trackeadas</span>
        </div>
      </div>

      {/* Add New Session Modal Form */}
      {isAddingSession && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-red-500/50 mb-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-white font-bold">
            <span>REGISTRAR NUEVA SESIÓN DE JUEGO</span>
            <span className="text-red-400">DIAGNÓSTICO RÁPIDO</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">MODO DE JUEGO</label>
              <select
                value={newMode}
                onChange={e => setNewMode(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="Duelo de Escuadras">Duelo de Escuadras (Ranked)</option>
                <option value="Battle Royale">Battle Royale Clásico</option>
                <option value="Entrenamiento & Miras">Entrenamiento de Miras</option>
                <option value="Torneo / Scrims">Torneo / Scrims Pro</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">PING PROMEDIO (MS)</label>
              <input
                type="number"
                value={newAvgPing}
                onChange={e => setNewAvgPing(+e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">DURACIÓN (MIN)</label>
              <input
                type="number"
                value={newDuration}
                onChange={e => setNewDuration(+e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsAddingSession(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-mono text-zinc-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddSession}
              className="px-4 py-1.5 rounded-lg bg-red-600 text-xs font-mono text-white font-bold"
            >
              Guardar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Session History List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto">
        <div className="text-xs font-mono text-zinc-400 flex items-center justify-between px-1">
          <span>HISTORIAL DE SESIONES</span>
          <span>ORDEN: MÁS RECIENTES</span>
        </div>

        {sessions.map(ses => (
          <div
            key={ses.id}
            className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{ses.gameMode}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {ses.durationMinutes} min
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{ses.date}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{ses.notes}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">PING MEDIO</span>
                <span className={`font-bold ${ses.avgPing < 40 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {ses.avgPing}ms
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">ESTABILIDAD</span>
                <span className="text-white font-bold">{ses.stabilityScore}%</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">TEMP ESTIMADA</span>
                <span className="text-zinc-300">{ses.deviceTempEstimate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
