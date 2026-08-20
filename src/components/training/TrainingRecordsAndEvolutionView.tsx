import React, { useState } from 'react';
import {
  TrainingSessionRecord,
  TrainingRecordsSummary,
  TrainingModuleId,
  ScreenId,
} from '../../types';
import {
  TRAINING_MODULE_META,
  getRankColor,
  deleteTrainingSession,
  clearTrainingHistory,
} from '../../utils/trainingEngine';
import { gamerAudio } from '../../utils/audio';
import {
  Trophy,
  TrendingUp,
  Trash2,
  Filter,
  Zap,
  Crosshair,
  Target,
  Brain,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface TrainingRecordsAndEvolutionViewProps {
  sessions: TrainingSessionRecord[];
  recordsSummary: TrainingRecordsSummary;
  onRefreshData: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export function TrainingRecordsAndEvolutionView({
  sessions,
  recordsSummary,
  onRefreshData,
  onNavigate,
}: TrainingRecordsAndEvolutionViewProps) {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<TrainingModuleId | 'all'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<TrainingSessionRecord | null>(null);

  // Filter sessions
  const filteredSessions = selectedModuleFilter === 'all'
    ? sessions
    : sessions.filter(s => s.module === selectedModuleFilter);

  // Chart chronological (oldest to newest)
  const chartData = [...filteredSessions].reverse();

  const handleDeleteItem = (id: string) => {
    gamerAudio.playClick();
    deleteTrainingSession(id);
    onRefreshData();
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todo el historial de entrenamientos? Esta acción es irreversible.')) {
      gamerAudio.playClick();
      clearTrainingHistory();
      onRefreshData();
    }
  };

  // SVG Chart Calculations
  const chartHeight = 160;
  const chartWidth = 580;
  const paddingX = 40;
  const paddingY = 25;

  const validPointsCount = Math.max(1, chartData.length);
  const getX = (idx: number) => {
    if (chartData.length <= 1) return chartWidth / 2;
    return paddingX + (idx / (chartData.length - 1)) * (chartWidth - paddingX * 2);
  };

  // Score Y (0 - 100)
  const getYScore = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return chartHeight - paddingY - (clamped / 100) * (chartHeight - paddingY * 2);
  };

  // Time Y (50ms - 500ms inverted: faster is higher)
  const getYTime = (timeMs: number) => {
    const clamped = Math.max(50, Math.min(500, timeMs));
    const ratio = 1 - (clamped - 50) / 450;
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  const scorePathD = chartData.length > 1
    ? chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYScore(d.score)}`).join(' ')
    : '';

  return (
    <div className="space-y-4 select-none">
      {/* 1. SECCIÓN RÉCORDS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              RÉCORDS HISTÓRICOS SENSI 33
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {recordsSummary.totalTrainingSessions} Sesiones Totales Registradas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Mejor Score Global */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/40 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-mono uppercase">RÉCORD GLOBAL</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-mono font-black text-amber-300 mt-1">
              {recordsSummary.bestGlobalScore} <span className="text-xs text-zinc-500">/ 100</span>
            </div>
            <span className="text-[9px] font-mono text-amber-500/80">Máximo Score</span>
          </div>

          {/* Mejor Flick */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-red-500/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-mono uppercase">MEJOR FLICK</span>
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-2xl font-mono font-black text-red-400 mt-1">
              {recordsSummary.bestFlickScore} <span className="text-xs text-zinc-500">pts</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              {recordsSummary.bestFlickTimeMs > 0 ? `${recordsSummary.bestFlickTimeMs} ms` : '--'}
            </span>
          </div>

          {/* Mejor Reacción */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-yellow-500/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-mono uppercase">MEJOR REACCIÓN</span>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-2xl font-mono font-black text-yellow-400 mt-1">
              {recordsSummary.bestReactionMs > 0 ? recordsSummary.bestReactionMs : '--'} <span className="text-xs text-zinc-500">ms</span>
            </div>
            <span className="text-[9px] font-mono text-yellow-500/80">Reflejo Táctil</span>
          </div>

          {/* Mejor Precisión */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-emerald-500/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-mono uppercase">MEJOR PRECISIÓN</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
              {recordsSummary.bestPrecisionPercent}%
            </div>
            <span className="text-[9px] font-mono text-emerald-500/80">Micro-Acierto</span>
          </div>

          {/* Mejor Consistencia */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-cyan-500/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-mono uppercase">CONSISTENCIA</span>
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
              {recordsSummary.bestConsistencyScore}%
            </div>
            <span className="text-[9px] font-mono text-cyan-500/80">Control Motor</span>
          </div>
        </div>
      </div>

      {/* 2. GRÁFICA DE EVOLUCIÓN DE ENTRENAMIENTO */}
      <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              EVOLUCIÓN TEMPORAL POR MÓDULO
            </span>
          </div>

          {/* Module Filter Chips */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedModuleFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                selectedModuleFilter === 'all'
                  ? 'bg-zinc-200 text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              TODOS ({sessions.length})
            </button>
            <button
              onClick={() => setSelectedModuleFilter('flick')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                selectedModuleFilter === 'flick'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-zinc-900 text-red-400 hover:text-white border border-red-500/30'
              }`}
            >
              FLICK
            </button>
            <button
              onClick={() => setSelectedModuleFilter('reaction')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                selectedModuleFilter === 'reaction'
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-zinc-900 text-yellow-400 hover:text-white border border-yellow-500/30'
              }`}
            >
              REACCIÓN
            </button>
            <button
              onClick={() => setSelectedModuleFilter('precision')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                selectedModuleFilter === 'precision'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-zinc-900 text-emerald-400 hover:text-white border border-emerald-500/30'
              }`}
            >
              PRECISIÓN
            </button>
            <button
              onClick={() => setSelectedModuleFilter('consistency')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                selectedModuleFilter === 'consistency'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-zinc-900 text-cyan-400 hover:text-white border border-cyan-500/30'
              }`}
            >
              CONSISTENCIA
            </button>
          </div>
        </div>

        {/* SVG Curve Display */}
        {chartData.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center text-zinc-500 text-xs font-mono">
            <span>No hay sesiones registradas en este filtro.</span>
            <span className="text-[10px] text-zinc-600 mt-1">Completa una prueba para generar la curva de evolución.</span>
          </div>
        ) : (
          <div className="relative w-full h-44 bg-black/40 rounded-xl border border-zinc-900 overflow-hidden flex flex-col justify-center">
            {/* Guide Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none text-[9px] font-mono text-zinc-700">
              <div className="flex justify-between border-b border-zinc-900/80 pb-0.5">
                <span>100 pts / Rango S+</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900/80 pb-0.5">
                <span>75 pts / Rango A</span>
              </div>
              <div className="flex justify-between">
                <span>50 pts / Rango B-C</span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
              {/* Path line */}
              {scorePathD && (
                <path
                  d={scorePathD}
                  fill="none"
                  stroke="#ff1e27"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_8px_rgba(255,30,39,0.7)]"
                />
              )}

              {/* Data points */}
              {chartData.map((point, idx) => {
                const cx = getX(idx);
                const cy = getYScore(point.score);
                const isHovered = hoveredPoint?.id === point.id;
                const meta = TRAINING_MODULE_META[point.module];

                return (
                  <g key={point.id} className="cursor-pointer">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={meta.accentColor}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2 : 1}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => gamerAudio.playClick()}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Point Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute bottom-2 right-2 bg-zinc-950/95 border border-zinc-700 p-2 rounded-xl text-[10px] font-mono text-zinc-300 shadow-xl backdrop-blur z-20 pointer-events-none">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <span>{TRAINING_MODULE_META[hoveredPoint.module].title} ({hoveredPoint.difficulty.toUpperCase()})</span>
                  <span className={`px-1 rounded ${getRankColor(hoveredPoint.rank)}`}>{hoveredPoint.rank}</span>
                </div>
                <div className="text-zinc-400 mt-0.5">
                  Score: <strong className="text-amber-400">{hoveredPoint.score} pts</strong> • Reacción: <strong className="text-yellow-400">{hoveredPoint.reactionTimeMs}ms</strong> • Precisión: <strong className="text-emerald-400">{hoveredPoint.accuracyPercent}%</strong>
                </div>
                <div className="text-zinc-500 text-[9px]">
                  {hoveredPoint.dateLabel} {hoveredPoint.timeLabel} • {hoveredPoint.detectedTrend}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Flick
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> Reacción
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Precisión
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Consistencia
            </span>
          </div>

          {onNavigate && (
            <button
              onClick={() => {
                gamerAudio.playSelect();
                onNavigate('evolution');
              }}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Abrir Modo Evolución Calibrador →</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. HISTORIAL DE SESIONES COMPLETAS */}
      <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            HISTORIAL DETALLADO ({filteredSessions.length})
          </span>

          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-mono text-red-500 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>VACIAR HISTORIAL</span>
            </button>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs font-mono">
            No hay registros guardados.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredSessions.map(session => {
              const meta = TRAINING_MODULE_META[session.module];
              const rankColor = getRankColor(session.rank);

              return (
                <div
                  key={session.id}
                  className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-sm ${rankColor}`}>
                      {session.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          {meta.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                          {session.difficulty}
                        </span>
                        {session.routineId && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Rutina
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                        <span>{session.dateLabel} {session.timeLabel}</span>
                        <span>•</span>
                        <span className="text-zinc-400">{session.detectedTrend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span>Score: <strong className="text-white">{session.score}</strong></span>
                      <span>Reacción: <strong className="text-yellow-400">{session.reactionTimeMs}ms</strong></span>
                      <span>Precisión: <strong className="text-emerald-400">{session.accuracyPercent}%</strong></span>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(session.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                      title="Eliminar sesión"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
