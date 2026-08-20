import React, { useState, useEffect, useRef } from 'react';
import {
  TrainingDifficulty,
  TrainingPrecisionTargetData,
  TrainingSessionRecord,
} from '../../types';
import {
  DIFFICULTY_CONFIGS,
  calculateTrainingRank,
  generateTrainingRecommendation,
} from '../../utils/trainingEngine';
import { gamerAudio } from '../../utils/audio';
import { Target, RotateCcw } from 'lucide-react';

interface TrainingPrecisionArenaProps {
  difficulty: TrainingDifficulty;
  totalTargets?: number;
  routineContext?: {
    routineId: string;
    step: number;
    totalSteps: number;
    title: string;
  };
  onComplete: (record: TrainingSessionRecord) => void;
  onCancel: () => void;
}

interface PrecisionTarget {
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
}

export function TrainingPrecisionArena({
  difficulty,
  totalTargets = 10,
  routineContext,
  onComplete,
  onCancel,
}: TrainingPrecisionArenaProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);
  const [target, setTarget] = useState<PrecisionTarget | null>(null);
  const [targetsData, setTargetsData] = useState<TrainingPrecisionTargetData[]>([]);
  const [isCountdown, setIsCountdown] = useState<boolean>(true);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [remainingTimePct, setRemainingTimePct] = useState<number>(100);

  const timerRef = useRef<number | null>(null);
  const progressAnimRef = useRef<number | null>(null);
  const startTimeSessionRef = useRef<number>(0);

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
        startTimeSessionRef.current = performance.now();
        spawnPrecisionTarget(0);
      }
    }, 650);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
    };
  }, []);

  const spawnPrecisionTarget = (index: number) => {
    if (index >= totalTargets) {
      finishPrecisionSession(targetsData);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);

    // Progressively reduce target size from max to min
    const progressRatio = index / Math.max(1, totalTargets - 1);
    const radius = Math.round(
      config.precisionMaxRadiusPx - progressRatio * (config.precisionMaxRadiusPx - config.precisionMinRadiusPx)
    );

    // Faster duration for later targets (up to 25% faster)
    const activeDuration = Math.round(config.activeWindowMs * (1 - progressRatio * 0.25));

    const margin = 15;
    const x = Math.floor(margin + Math.random() * (100 - margin * 2));
    const y = Math.floor(margin + Math.random() * (100 - margin * 2));

    const spawnTime = performance.now();
    const newTarget: PrecisionTarget = { x, y, radius, spawnTime };

    setTarget(newTarget);
    setCurrentTargetIndex(index);
    setRemainingTimePct(100);
    gamerAudio.playTargetSpawn();

    // Animate progress bar
    const updateProgress = () => {
      const elapsed = performance.now() - spawnTime;
      const pct = Math.max(0, 100 - (elapsed / activeDuration) * 100);
      setRemainingTimePct(pct);
      if (pct > 0) {
        progressAnimRef.current = requestAnimationFrame(updateProgress);
      }
    };
    progressAnimRef.current = requestAnimationFrame(updateProgress);

    // Miss timeout
    timerRef.current = window.setTimeout(() => {
      handleTargetExpired(index, activeDuration);
    }, activeDuration);
  };

  const handleTargetExpired = (index: number, timeSpent: number) => {
    gamerAudio.playMiss();

    const data: TrainingPrecisionTargetData = {
      targetIndex: index + 1,
      timeSpentMs: timeSpent,
      targetRadius: target?.radius || config.precisionMinRadiusPx,
      hit: false,
      points: 0,
    };

    const newTargets = [...targetsData, data];
    setTargetsData(newTargets);

    if (index + 1 >= totalTargets) {
      finishPrecisionSession(newTargets);
    } else {
      setTimeout(() => spawnPrecisionTarget(index + 1), 180);
    }
  };

  const handleTargetClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!target) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);

    const hitTime = performance.now();
    const timeSpentMs = Math.max(30, Math.round(hitTime - target.spawnTime));

    // Calculate proximity to center of precision target
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - targetCenterX, clientY - targetCenterY);

    const proximityRatio = Math.max(0, 1 - dist / target.radius);
    const points = Math.round(50 + proximityRatio * 50);

    if (points >= 90) {
      gamerAudio.playHeadshotTone();
    } else {
      gamerAudio.playClick();
    }

    const data: TrainingPrecisionTargetData = {
      targetIndex: currentTargetIndex + 1,
      timeSpentMs,
      targetRadius: target.radius,
      hit: true,
      points,
    };

    const newTargets = [...targetsData, data];
    setTargetsData(newTargets);
    setTarget(null);

    if (currentTargetIndex + 1 >= totalTargets) {
      finishPrecisionSession(newTargets);
    } else {
      setTimeout(() => spawnPrecisionTarget(currentTargetIndex + 1), 150);
    }
  };

  const finishPrecisionSession = (finalTargets: TrainingPrecisionTargetData[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);

    const hits = finalTargets.filter(t => t.hit).length;
    const misses = finalTargets.length - hits;
    const accuracyPercent = Math.round((hits / Math.max(1, finalTargets.length)) * 100);

    const hitTargets = finalTargets.filter(t => t.hit);
    const avgTimeMs = hitTargets.length > 0
      ? Math.round(hitTargets.reduce((a, b) => a + b.timeSpentMs, 0) / hitTargets.length)
      : config.activeWindowMs;

    const bestTimeMs = hitTargets.length > 0
      ? Math.min(...hitTargets.map(t => t.timeSpentMs))
      : config.activeWindowMs;

    const worstTimeMs = hitTargets.length > 0
      ? Math.max(...finalTargets.map(t => t.timeSpentMs))
      : config.activeWindowMs;

    // Consistency score (0-100)
    const points = finalTargets.map(t => t.points);
    const avgPoints = points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0;
    const consistencyScore = Math.max(30, Math.min(100, Math.round(avgPoints)));

    // Final score computation
    const accPoints = accuracyPercent * 0.6;
    const speedPoints = Math.max(0, (1 - avgTimeMs / config.activeWindowMs) * 40);
    const finalScore = Math.max(10, Math.min(100, Math.round(accPoints + speedPoints)));
    const rank = calculateTrainingRank(finalScore);

    const { recommendation, detectedTrend } = generateTrainingRecommendation(
      'precision',
      finalScore,
      avgTimeMs,
      accuracyPercent,
      consistencyScore,
      { difficulty }
    );

    const now = new Date();
    const record: TrainingSessionRecord = {
      id: `train_precision_${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${now.getDate()}/${now.getMonth() + 1}`,
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      module: 'precision',
      difficulty,
      routineId: routineContext?.routineId as any,
      routineStep: routineContext?.step,
      routineTotalSteps: routineContext?.totalSteps,
      score: finalScore,
      rank,
      reactionTimeMs: avgTimeMs,
      bestReactionTimeMs: bestTimeMs,
      worstReactionTimeMs: worstTimeMs,
      accuracyPercent,
      consistencyScore,
      hits,
      misses,
      totalRounds: totalTargets,
      detectedTrend,
      recommendation,
    };

    onComplete(record);
  };

  return (
    <div className="relative w-full h-full bg-[#050508] border border-emerald-500/30 rounded-2xl overflow-hidden select-none flex flex-col justify-between">
      {/* Header HUD */}
      <div className="p-3 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wider">ENTRENAMIENTO DE PRECISIÓN</span>
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
              Dianas progresivamente reducidas. Toca con exactitud antes de que expire el tiempo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">DIANA:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {Math.min(currentTargetIndex + 1, totalTargets)} / {totalTargets}
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
      <div className="relative flex-1 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.05)_0%,rgba(5,5,8,0.95)_100%)] overflow-hidden cursor-crosshair">
        {isCountdown && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
            <div className="text-zinc-500 font-mono text-xs mb-2 tracking-widest uppercase">
              CALIBRANDO DIANAS DE PRECISIÓN...
            </div>
            <div className="text-7xl font-mono font-black text-emerald-500 animate-ping">
              {countdownNum > 0 ? countdownNum : '¡YA!'}
            </div>
          </div>
        )}

        {!isCountdown && target && (
          <div
            id="precision-target-active"
            onClick={handleTargetClick}
            onTouchStart={handleTargetClick}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.radius * 2}px`,
              height: `${target.radius * 2}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90"
          >
            {/* Precision Rings */}
            <div className="w-full h-full rounded-full bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] flex items-center justify-center relative">
              <div className="w-2/3 h-2/3 rounded-full bg-white/30 border border-white flex items-center justify-center">
                <div className="w-1/2 h-1/2 rounded-full bg-emerald-500 shadow-[0_0_6px_#34d399]" />
              </div>

              {/* Circular Expiration Indicator */}
              <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="rgba(52, 211, 153, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="100"
                  strokeDashoffset={100 - remainingTimePct}
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Aciertos: <strong className="text-emerald-400">{targetsData.filter(t => t.hit).length}</strong></span>
          <span>Fallos: <strong className="text-red-400">{targetsData.filter(t => !t.hit).length}</strong></span>
          <span>Tamaño Actual: <strong className="text-zinc-300">{target ? `${target.radius * 2}px` : '--'}</strong></span>
        </div>
        <div className="text-zinc-600">SENSI 33 MICRO-PRECISION ENGINE</div>
      </div>
    </div>
  );
}
