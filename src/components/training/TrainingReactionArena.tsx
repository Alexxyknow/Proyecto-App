import React, { useState, useEffect, useRef } from 'react';
import {
  TrainingDifficulty,
  TrainingReactionRoundData,
  TrainingSessionRecord,
} from '../../types';
import {
  DIFFICULTY_CONFIGS,
  calculateTrainingRank,
  generateTrainingRecommendation,
} from '../../utils/trainingEngine';
import { gamerAudio } from '../../utils/audio';
import { Zap, AlertTriangle, Play, RotateCcw } from 'lucide-react';

interface TrainingReactionArenaProps {
  difficulty: TrainingDifficulty;
  totalRounds?: number;
  routineContext?: {
    routineId: string;
    step: number;
    totalSteps: number;
    title: string;
  };
  onComplete: (record: TrainingSessionRecord) => void;
  onCancel: () => void;
}

type ReactionState = 'waiting' | 'ready_signal' | 'early_penalty' | 'round_result';

export function TrainingReactionArena({
  difficulty,
  totalRounds = 10,
  routineContext,
  onComplete,
  onCancel,
}: TrainingReactionArenaProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [reactionState, setReactionState] = useState<ReactionState>('waiting');
  const [roundsData, setRoundsData] = useState<TrainingReactionRoundData[]>([]);
  const [earlyTapsCount, setEarlyTapsCount] = useState<number>(0);
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);

  const signalTimeRef = useRef<number>(0);
  const waitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    startNextRound(0);
    return () => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    };
  }, []);

  const startNextRound = (roundIdx: number) => {
    if (roundIdx >= totalRounds) {
      finishReactionSession(roundsData, earlyTapsCount);
      return;
    }

    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);

    setReactionState('waiting');
    setCurrentRound(roundIdx);

    // Random wait between config min and max
    const randomDelay = Math.floor(
      config.reactionMinWaitMs +
      Math.random() * (config.reactionMaxWaitMs - config.reactionMinWaitMs)
    );

    waitTimeoutRef.current = window.setTimeout(() => {
      signalTimeRef.current = performance.now();
      setReactionState('ready_signal');
      gamerAudio.playTargetSpawn();
    }, randomDelay);
  };

  const handleArenaTap = () => {
    if (reactionState === 'waiting') {
      // Early tap detected!
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      gamerAudio.playMiss();
      setEarlyTapsCount(prev => prev + 1);
      setReactionState('early_penalty');

      // Restart same round after 1 second
      setTimeout(() => {
        startNextRound(currentRound);
      }, 1000);
      return;
    }

    if (reactionState === 'ready_signal') {
      // Valid reaction!
      const clickTime = performance.now();
      const reactionTimeMs = Math.max(30, Math.round(clickTime - signalTimeRef.current));

      if (reactionTimeMs <= 140) {
        gamerAudio.playHeadshotTone();
      } else {
        gamerAudio.playClick();
      }

      setLastReactionMs(reactionTimeMs);
      setReactionState('round_result');

      const roundResult: TrainingReactionRoundData = {
        roundIndex: currentRound + 1,
        reactionTimeMs,
        valid: true,
        isEarlyTap: false,
      };

      const updatedRounds = [...roundsData, roundResult];
      setRoundsData(updatedRounds);

      setTimeout(() => {
        if (currentRound + 1 >= totalRounds) {
          finishReactionSession(updatedRounds, earlyTapsCount);
        } else {
          startNextRound(currentRound + 1);
        }
      }, 650);
    }
  };

  const finishReactionSession = (finalRounds: TrainingReactionRoundData[], totalEarly: number) => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);

    const validRounds = finalRounds.filter(r => r.valid);
    const times = validRounds.map(r => r.reactionTimeMs);

    const avgMs = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 250;
    const bestMs = times.length > 0 ? Math.min(...times) : avgMs;
    const worstMs = times.length > 0 ? Math.max(...times) : avgMs;

    // Consistency score (variance of times)
    let variance = 0;
    if (times.length > 1) {
      variance = times.reduce((a, b) => a + Math.pow(b - avgMs, 2), 0) / times.length;
    }
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(30, Math.min(100, Math.round(100 - stdDev * 0.5)));

    // Score calculation
    // Scale: 120ms or less -> 100pts; 350ms or more -> 40pts
    const speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgMs - 120) * 0.35)));
    const earlyPenalty = totalEarly * 5;
    const finalScore = Math.max(10, Math.min(100, Math.round(speedScore * 0.8 + consistencyScore * 0.2 - earlyPenalty)));
    const rank = calculateTrainingRank(finalScore);

    const { recommendation, detectedTrend } = generateTrainingRecommendation(
      'reaction',
      finalScore,
      avgMs,
      100 - totalEarly * 10,
      consistencyScore,
      { earlyTaps: totalEarly, difficulty }
    );

    const now = new Date();
    const record: TrainingSessionRecord = {
      id: `train_reaction_${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${now.getDate()}/${now.getMonth() + 1}`,
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      module: 'reaction',
      difficulty,
      routineId: routineContext?.routineId as any,
      routineStep: routineContext?.step,
      routineTotalSteps: routineContext?.totalSteps,
      score: finalScore,
      rank,
      reactionTimeMs: avgMs,
      bestReactionTimeMs: bestMs,
      worstReactionTimeMs: worstMs,
      accuracyPercent: Math.max(40, 100 - totalEarly * 10),
      consistencyScore,
      hits: validRounds.length,
      misses: totalEarly,
      totalRounds,
      earlyTapsCount: totalEarly,
      detectedTrend,
      recommendation,
    };

    onComplete(record);
  };

  return (
    <div className="relative w-full h-full bg-[#050508] border border-yellow-500/30 rounded-2xl overflow-hidden select-none flex flex-col justify-between">
      {/* Header HUD */}
      <div className="p-3 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wider">ENTRENAMIENTO DE REACCIÓN</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${config.badgeColor}`}>
                {config.name}
              </span>
              {routineContext && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Paso {routineContext.step}/{routineContext.totalSteps}
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-zinc-400">
              Espera a que la pantalla cambie a ROJO/BLANCO y toca inmediatamente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">RONDA:</span>
            <span className="text-yellow-400 font-bold text-sm">
              {Math.min(currentRound + 1, totalRounds)} / {totalRounds}
            </span>
          </div>

          <button
            onClick={onCancel}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 font-mono text-[11px] transition cursor-pointer"
          >
            CANCELAR
          </button>
        </div>
      </div>

      {/* Main Touch Arena */}
      <div
        id="reaction-touch-surface"
        onClick={handleArenaTap}
        onTouchStart={handleArenaTap}
        className={`relative flex-1 w-full h-full flex flex-col items-center justify-center transition-colors duration-100 cursor-pointer overflow-hidden ${
          reactionState === 'waiting'
            ? 'bg-zinc-950/95 hover:bg-zinc-900/60'
            : reactionState === 'ready_signal'
            ? 'bg-red-600 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]'
            : reactionState === 'early_penalty'
            ? 'bg-orange-950/90'
            : 'bg-emerald-950/80'
        }`}
      >
        {/* Waiting State */}
        {reactionState === 'waiting' && (
          <div className="flex flex-col items-center gap-3 pointer-events-none animate-pulse">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-zinc-600" />
            </div>
            <div className="text-sm font-mono font-bold text-zinc-400 tracking-widest uppercase">
              PREPÁRATE... ¡ESPERA LA SEÑAL!
            </div>
            <p className="text-xs font-mono text-zinc-600">
              (No toques antes o se reiniciará la ronda)
            </p>
          </div>
        )}

        {/* Ready Signal State */}
        {reactionState === 'ready_signal' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none animate-scale-up">
            <div className="w-24 h-24 rounded-full bg-white shadow-[0_0_50px_#ffffff] flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-600 animate-ping" />
            </div>
            <div className="text-3xl font-mono font-black text-white tracking-widest uppercase mt-3">
              ¡TOCA AHORA!
            </div>
          </div>
        )}

        {/* Early Penalty State */}
        {reactionState === 'early_penalty' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="p-3 rounded-full bg-orange-600/30 text-orange-400 border border-orange-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="text-xl font-mono font-black text-orange-400 tracking-wider uppercase">
              ¡DEMASIADO PRONTO!
            </div>
            <p className="text-xs font-mono text-orange-300/80">
              Anticipación detectada. Reiniciando ronda...
            </p>
          </div>
        )}

        {/* Round Result State */}
        {reactionState === 'round_result' && (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="text-xs font-mono text-emerald-300 uppercase tracking-widest">
              TIEMPO REGISTRADO
            </div>
            <div className="text-5xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">
              {lastReactionMs} <span className="text-2xl text-emerald-400">ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Mejor Tiempo: <strong className="text-emerald-400">{roundsData.length > 0 ? Math.min(...roundsData.map(r => r.reactionTimeMs)) : '--'} ms</strong></span>
          <span>Anticipaciones: <strong className="text-orange-400">{earlyTapsCount}</strong></span>
        </div>
        <div className="text-zinc-600">SENSI 33 REACTION ENGINE</div>
      </div>
    </div>
  );
}
