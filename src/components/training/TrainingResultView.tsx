import React, { useState } from 'react';
import {
  TrainingSessionRecord,
  ScreenId,
} from '../../types';
import {
  TRAINING_MODULE_META,
  getRankColor,
  saveTrainingSession,
} from '../../utils/trainingEngine';
import { gamerAudio } from '../../utils/audio';
import {
  Trophy,
  RotateCcw,
  Save,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Crosshair,
  Target,
  Brain,
  ShieldAlert,
} from 'lucide-react';

interface TrainingResultViewProps {
  record: TrainingSessionRecord;
  isRoutineStep?: boolean;
  hasNextRoutineStep?: boolean;
  onRepeat: () => void;
  onNextRoutineStep?: () => void;
  onReturnToHub: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export function TrainingResultView({
  record,
  isRoutineStep = false,
  hasNextRoutineStep = false,
  onRepeat,
  onNextRoutineStep,
  onReturnToHub,
  onNavigate,
}: TrainingResultViewProps) {
  const [saved, setSaved] = useState<boolean>(false);
  const meta = TRAINING_MODULE_META[record.module];
  const rankBadgeStyle = getRankColor(record.rank);

  const handleSave = () => {
    gamerAudio.playSelect();
    saveTrainingSession(record);
    setSaved(true);
  };

  return (
    <div className="relative w-full h-full bg-[#07070a] border border-zinc-800/80 rounded-2xl overflow-y-auto p-4 sm:p-6 select-none flex flex-col justify-between">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Result Strip */}
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-red-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-mono font-black text-white tracking-wider">
                  RESULTADOS DEL ENTRENAMIENTO
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 uppercase text-zinc-300">
                  {meta.title} — {record.difficulty.toUpperCase()}
                </span>
                {isRoutineStep && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Paso {record.routineStep}/{record.routineTotalSteps}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-400">
                {record.dateLabel} a las {record.timeLabel} • Diagnóstico táctico completado
              </p>
            </div>
          </div>

          {/* Quick Hub Back */}
          <button
            onClick={onReturnToHub}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CENTRO</span>
          </button>
        </div>

        {/* Score & Rank Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Main Score & Rank Card */}
          <div className="p-4 rounded-2xl bg-zinc-950/90 border border-red-500/30 flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">PUNTUACIÓN GLOBAL</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(255,30,39,0.5)]">
                  {record.score}
                </span>
                <span className="text-sm font-mono text-zinc-500">/ 100</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                Escala interna de entrenamiento SENSI 33
              </div>
            </div>

            {/* Rank Badge */}
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center font-mono font-black text-3xl sm:text-4xl ${rankBadgeStyle}`}>
                {record.rank}
              </div>
              <span className="text-[9px] font-mono text-zinc-400 mt-1 uppercase">RANGO {record.rank}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Reaction / Avg Time */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-yellow-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-mono uppercase">TIEMPO MEDIO</span>
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div className="text-2xl font-mono font-black text-yellow-400 mt-1">
                {record.reactionTimeMs} <span className="text-xs text-zinc-500">ms</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">
                Mejor: {record.bestReactionTimeMs} ms
              </span>
            </div>

            {/* Accuracy */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-mono uppercase">PRECISIÓN</span>
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                {record.accuracyPercent}%
              </div>
              <span className="text-[9px] font-mono text-zinc-500">
                {record.hits} aciertos / {record.totalRounds}
              </span>
            </div>

            {/* Consistency */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-cyan-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-mono uppercase">CONSISTENCIA</span>
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                {record.consistencyScore}%
              </div>
              <span className="text-[9px] font-mono text-zinc-500">
                Retención motora
              </span>
            </div>

            {/* Specific Breakdown */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-mono uppercase">ESPECÍFICO</span>
                <Target className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="text-xs font-mono text-zinc-300 mt-1 space-y-0.5">
                {record.module === 'flick' && (
                  <>
                    <div className="text-[10px]">Overshoot: <strong className="text-red-400">{record.overshootCount || 0}</strong></div>
                    <div className="text-[10px]">Undershoot: <strong className="text-yellow-400">{record.undershootCount || 0}</strong></div>
                  </>
                )}
                {record.module === 'reaction' && (
                  <>
                    <div className="text-[10px]">Peor: <strong className="text-zinc-400">{record.worstReactionTimeMs}ms</strong></div>
                    <div className="text-[10px]">Anticipación: <strong className="text-orange-400">{record.earlyTapsCount || 0}</strong></div>
                  </>
                )}
                {record.module === 'precision' && (
                  <>
                    <div className="text-[10px]">Aciertos: <strong className="text-emerald-400">{record.hits}</strong></div>
                    <div className="text-[10px]">Fallos: <strong className="text-red-400">{record.misses}</strong></div>
                  </>
                )}
                {record.module === 'consistency' && (
                  <>
                    <div className="text-[10px]">Δ Precisión: <strong className="text-cyan-400">{record.accuracyVariationPercent && record.accuracyVariationPercent > 0 ? `+${record.accuracyVariationPercent}%` : `${record.accuracyVariationPercent || 0}%`}</strong></div>
                    <div className="text-[10px]">Δ Tiempo: <strong className="text-cyan-400">{record.timeVariationMs && record.timeVariationMs > 0 ? `+${record.timeVariationMs}ms` : `${record.timeVariationMs || 0}ms`}</strong></div>
                  </>
                )}
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Métricas puras</span>
            </div>
          </div>
        </div>

        {/* Diagnosis & Recommendation Card */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                DIAGNÓSTICO TÁCTICO & RECOMENDACIÓN
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-amber-500/30">
              {record.detectedTrend}
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
            {record.recommendation}
          </p>
        </div>

        {/* Fair Play & Independent Tool Disclaimer */}
        <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-900 text-[10px] font-mono text-zinc-500 flex items-center gap-2 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <span>
            Esta evaluación se ejecuta de forma 100% aislada e interactiva dentro de SENSI 33. No interactúa ni modifica el juego Free Fire ni sus archivos.
          </span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="border-t border-zinc-800/80 pt-3 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2">
          <button
            id="btn-repeat-training"
            onClick={() => {
              gamerAudio.playSelect();
              onRepeat();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REPETIR PRUEBA</span>
          </button>

          <button
            id="btn-save-training-result"
            onClick={handleSave}
            disabled={saved}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
              saved
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GUARDADO EN HISTORIAL</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>GUARDAR RESULTADO</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => {
                gamerAudio.playSelect();
                onNavigate('evolution');
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VER EN MODO EVOLUCIÓN</span>
              <span className="sm:hidden">EVOLUCIÓN</span>
            </button>
          )}

          {isRoutineStep && hasNextRoutineStep && onNextRoutineStep ? (
            <button
              id="btn-next-routine-step"
              onClick={() => {
                gamerAudio.playSelect();
                onNextRoutineStep();
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,30,39,0.4)]"
            >
              <span>SIGUIENTE EJERCICIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="btn-return-training-center"
              onClick={() => {
                gamerAudio.playSelect();
                onReturnToHub();
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,30,39,0.4)]"
            >
              <span>VOLVER AL CENTRO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
