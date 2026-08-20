import React, { useState, useEffect, useRef } from 'react';
import {
  TrainingDifficulty,
  TrainingConsistencyAttemptData,
  TrainingSessionRecord,
} from '../../types';
import {
  DIFFICULTY_CONFIGS,
  calculateTrainingRank,
  generateTrainingRecommendation,
} from '../../utils/trainingEngine';
import { gamerAudio } from '../../utils/audio';
import { Brain, RotateCcw } from 'lucide-react';

interface TrainingConsistencyArenaProps {
  difficulty: TrainingDifficulty;
  totalAttempts?: number;
  routineContext?: {
    routineId: string;
    step: number;
    totalSteps: number;
    title: string;
  };
  onComplete: (record: TrainingSessionRecord) => void;
  onCancel: () => void;
}

interface ConsistencyTarget {
  x: number;
  y: number;
  spawnTime: number;
  radius: number;
}

export function TrainingConsistencyArena({
  difficulty,
  totalAttempts = 12,
  routineContext,
  onComplete,
  onCancel,
}: TrainingConsistencyArenaProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [target, setTarget] = useState<ConsistencyTarget | null>(null);
  const [attemptsData, setAttemptsData] = useState<TrainingConsistencyAttemptData[]>([]);
  const [isCountdown, setIsCountdown] = useState<boolean>(true);
  const [countdownNum, setCountdownNum] = useState<number>(3);

  const timerRef = useRef<number | null>(null);
  const halfPoint = Math.floor(totalAttempts / 2);

  useEffect(() => {
    let count = 3;
    gamerAudio.playCountdown(false);
    const interval = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        gamerAudio.playCountdown(false);
      } else if (count === 0) {
        setCountdownNum(0);
        gamerAudio.playCountdown(true);
      } else {
        clearInterval(interval);
        setIsCountdown(false);
        spawnTarget(0);
      }
    }, 650);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const spawnTarget = (index: number) => {
    if (index >= totalAttempts) {
      finishConsistencySession(attemptsData);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    // Identical target size throughout to test motor consistency
    const radius = config.targetRadiusPx;
    const margin = 18;
    const x = Math.floor(margin + Math.random() * (100 - margin * 2));
    const y = Math.floor(margin + Math.random() * (100 - margin * 2));

    const newTarget: ConsistencyTarget = {
      x,
      y,
      spawnTime: performance.now(),
      radius,
    };

    setTarget(newTarget);
    setCurrentAttempt(index);
    gamerAudio.playTargetSpawn();

    // Timeout
    timerRef.current = window.setTimeout(() => {
      handleAttemptMiss(index);
    }, config.activeWindowMs);
  };

  const handleAttemptMiss = (index: number) => {
    gamerAudio.playMiss();

    const data: TrainingConsistencyAttemptData = {
      attemptIndex: index + 1,
      reactionTimeMs: config.activeWindowMs,
      accuracyScore: 0,
      isFirstHalf: index < halfPoint,
    };

    const newAttempts = [...attemptsData, data];
    setAttemptsData(newAttempts);

    if (index + 1 >= totalAttempts) {
      finishConsistencySession(newAttempts);
    } else {
      setTimeout(() => spawnTarget(index + 1), 160);
    }
  };

  const handleTargetHit = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!target) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const hitTime = performance.now();
    const reactionTimeMs = Math.max(30, Math.round(hitTime - target.spawnTime));

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - targetCenterX, clientY - targetCenterY);

    const proximityRatio = Math.max(0, 1 - dist / target.radius);
    const accuracyScore = Math.round(40 + proximityRatio * 60);

    if (accuracyScore >= 85) {
      gamerAudio.playHeadshotTone();
    } else {
      gamerAudio.playClick();
    }

    const data: TrainingConsistencyAttemptData = {
      attemptIndex: currentAttempt + 1,
      reactionTimeMs,
      accuracyScore,
      isFirstHalf: currentAttempt < halfPoint,
    };

    const newAttempts = [...attemptsData, data];
    setAttemptsData(newAttempts);
    setTarget(null);

    if (currentAttempt + 1 >= totalAttempts) {
      finishConsistencySession(newAttempts);
    } else {
      setTimeout(() => spawnTarget(currentAttempt + 1), 160);
    }
  };

  const finishConsistencySession = (finalAttempts: TrainingConsistencyAttemptData[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const firstHalf = finalAttempts.filter(a => a.isFirstHalf);
    const secondHalf = finalAttempts.filter(a => !a.isFirstHalf);

    const avgFirstAcc = firstHalf.length > 0
      ? firstHalf.reduce((a, b) => a + b.accuracyScore, 0) / firstHalf.length
      : 0;
    const avgSecondAcc = secondHalf.length > 0
      ? secondHalf.reduce((a, b) => a + b.accuracyScore, 0) / secondHalf.length
      : 0;
    const accuracyVariation = Math.round(avgSecondAcc - avgFirstAcc);

    const avgFirstTime = firstHalf.length > 0
      ? firstHalf.reduce((a, b) => a + b.reactionTimeMs, 0) / firstHalf.length
      : config.activeWindowMs;
    const avgSecondTime = secondHalf.length > 0
      ? secondHalf.reduce((a, b) => a + b.reactionTimeMs, 0) / secondHalf.length
      : config.activeWindowMs;
    const timeVariation = Math.round(avgSecondTime - avgFirstTime);

    const allTimes = finalAttempts.map(a => a.reactionTimeMs);
    const globalAvgTime = Math.round(allTimes.reduce((a, b) => a + b, 0) / Math.max(1, allTimes.length));
    const bestTime = Math.min(...allTimes);
    const worstTime = Math.max(...allTimes);

    const globalAvgAcc = Math.round(
      finalAttempts.reduce((a, b) => a + b.accuracyScore, 0) / Math.max(1, finalAttempts.length)
    );

    // Consistency Index (0-100) based on stability between first & second half
    const accStabilityPenalty = Math.abs(accuracyVariation) * 1.5;
    const timeStabilityPenalty = Math.max(0, (Math.abs(timeVariation) - 10) * 0.8);
    const consistencyScore = Math.max(25, Math.min(100, Math.round(100 - accStabilityPenalty - timeStabilityPenalty)));

    // Score calculation
    const finalScore = Math.max(10, Math.min(100, Math.round(consistencyScore * 0.5 + globalAvgAcc * 0.3 + (1 - globalAvgTime / 600) * 20)));
    const rank = calculateTrainingRank(finalScore);

    const { recommendation, detectedTrend } = generateTrainingRecommendation(
      'consistency',
      finalScore,
      globalAvgTime,
      globalAvgAcc,
      consistencyScore,
      {
        accuracyVariation,
        timeVariation,
        difficulty,
      }
    );

    const now = new Date();
    const record: TrainingSessionRecord = {
      id: `train_consistency_${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${now.getDate()}/${now.getMonth() + 1}`,
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      module: 'consistency',
      difficulty,
      routineId: routineContext?.routineId as any,
      routineStep: routineContext?.step,
      routineTotalSteps: routineContext?.totalSteps,
      score: finalScore,
      rank,
      reactionTimeMs: globalAvgTime,
      bestReactionTimeMs: bestTime,
      worstReactionTimeMs: worstTime,
      accuracyPercent: globalAvgAcc,
      consistencyScore,
      hits: finalAttempts.filter(a => a.accuracyScore > 0).length,
      misses: finalAttempts.filter(a => a.accuracyScore === 0).length,
      totalRounds: totalAttempts,
      accuracyVariationPercent: accuracyVariation,
      timeVariationMs: timeVariation,
      detectedTrend,
      recommendation,
    };

    onComplete(record);
  };

  return (
    <div className="relative w-full h-full bg-[#050508] border border-cyan-500/30 rounded-2xl overflow-hidden select-none flex flex-col justify-between">
      {/* Header HUD */}
      <div className="p-3 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wider">ENTRENAMIENTO DE CONSISTENCIA</span>
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
              Mantén el mismo ritmo y precisión durante toda la serie para evitar fatiga motora.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">FASE:</span>
            <span className="text-cyan-400 font-bold">
              {currentAttempt < halfPoint ? '1ª Mitad' : '2ª Mitad'} ({Math.min(currentAttempt + 1, totalAttempts)}/{totalAttempts})
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

      {/* Target Arena */}
      <div className="relative flex-1 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05)_0%,rgba(5,5,8,0.95)_100%)] overflow-hidden cursor-crosshair">
        {isCountdown && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
            <div className="text-zinc-500 font-mono text-xs mb-2 tracking-widest uppercase">
              INICIANDO CONTROL DE RESISTENCIA Y CONSISTENCIA...
            </div>
            <div className="text-7xl font-mono font-black text-cyan-400 animate-ping">
              {countdownNum > 0 ? countdownNum : '¡YA!'}
            </div>
          </div>
        )}

        {!isCountdown && target && (
          <div
            id="consistency-target-active"
            onClick={handleTargetHit}
            onTouchStart={handleTargetHit}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.radius * 2}px`,
              height: `${target.radius * 2}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90"
          >
            <div className="w-full h-full rounded-full bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] flex items-center justify-center">
              <div className="w-2/3 h-2/3 rounded-full bg-white/30 border border-white flex items-center justify-center">
                <div className="w-1/2 h-1/2 rounded-full bg-cyan-500 shadow-[0_0_6px_#22d3ee]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Intentos Completados: <strong className="text-cyan-400">{attemptsData.length}/{totalAttempts}</strong></span>
          <span>Objetivo: <strong className="text-zinc-300">Variación Mínima</strong></span>
        </div>
        <div className="text-zinc-600">SENSI 33 CONSISTENCY ENGINE</div>
      </div>
    </div>
  );
}
