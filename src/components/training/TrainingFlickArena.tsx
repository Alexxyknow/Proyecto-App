import React, { useState, useEffect, useRef } from 'react';
import {
  TrainingDifficulty,
  TrainingFlickShotData,
  TrainingSessionRecord,
} from '../../types';
import {
  DIFFICULTY_CONFIGS,
  calculateTrainingRank,
  generateTrainingRecommendation,
} from '../../utils/trainingEngine';
import { gamerAudio } from '../../utils/audio';
import { Crosshair, Zap, RotateCcw, ArrowRight } from 'lucide-react';

interface TrainingFlickArenaProps {
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

interface TargetPosition {
  x: number; // percentage 10% to 90%
  y: number; // percentage 15% to 85%
  spawnTime: number;
  radius: number;
}

export function TrainingFlickArena({
  difficulty,
  totalTargets = 10,
  routineContext,
  onComplete,
  onCancel,
}: TrainingFlickArenaProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);
  const [target, setTarget] = useState<TargetPosition | null>(null);
  const [shots, setShots] = useState<TrainingFlickShotData[]>([]);
  const [isCountdown, setIsCountdown] = useState<boolean>(true);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [lastShotFeedback, setLastShotFeedback] = useState<{
    text: string;
    color: string;
    ms: number;
  } | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Countdown 3, 2, 1, GO
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
        spawnNextTarget(0);
      }
    }, 650);

    return () => clearInterval(interval);
  }, []);

  const spawnNextTarget = (index: number) => {
    if (index >= totalTargets) {
      finishSession(shots);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Calculate randomized target within safe arena margins based on difficulty distance factor
    const margin = (1 - config.flickDistanceFactor) * 20 + 10; // 10% to 20%
    const minX = margin;
    const maxX = 100 - margin;
    const minY = margin + 5;
    const maxY = 100 - margin;

    const x = Math.floor(minX + Math.random() * (maxX - minX));
    const y = Math.floor(minY + Math.random() * (maxY - minY));

    const newTarget: TargetPosition = {
      x,
      y,
      spawnTime: performance.now(),
      radius: config.targetRadiusPx,
    };

    setTarget(newTarget);
    setCurrentTargetIndex(index);
    gamerAudio.playTargetSpawn();

    // Expire timer if player doesn't touch in time window
    timerRef.current = window.setTimeout(() => {
      handleTargetMiss(index, newTarget);
    }, config.activeWindowMs);
  };

  const handleTargetMiss = (index: number, t: TargetPosition) => {
    gamerAudio.playMiss();
    setLastShotFeedback({ text: '¡TIEMPO AGOTADO!', color: 'text-red-500', ms: config.activeWindowMs });

    const missShot: TrainingFlickShotData = {
      targetIndex: index + 1,
      reactionTimeMs: config.activeWindowMs,
      distancePx: 250,
      accuracyScore: 0,
      isHit: false,
      isOvershoot: false,
      isUndershoot: true,
      offsetPx: t.radius * 2,
    };

    const newShots = [...shots, missShot];
    setShots(newShots);

    if (index + 1 >= totalTargets) {
      finishSession(newShots);
    } else {
      setTimeout(() => spawnNextTarget(index + 1), 200);
    }
  };

  const handleTargetHit = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!target) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const hitTime = performance.now();
    const reactionTimeMs = Math.max(40, Math.round(hitTime - target.spawnTime));

    // Calculate proximity to center of target
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;

    const distFromCenter = Math.hypot(clientX - targetCenterX, clientY - targetCenterY);
    const maxRadius = target.radius;
    const proximityRatio = Math.max(0, 1 - distFromCenter / maxRadius);

    // Accuracy score 40 - 100 on hit
    const accuracyScore = Math.round(40 + proximityRatio * 60);

    // Overshoot vs Undershoot analysis (based on whether touch landed beyond target center or short)
    const isOvershoot = distFromCenter > maxRadius * 0.4 && clientY < targetCenterY;
    const isUndershoot = distFromCenter > maxRadius * 0.4 && clientY >= targetCenterY;

    if (accuracyScore >= 85) {
      gamerAudio.playHeadshotTone();
      setLastShotFeedback({ text: '¡HEADSHOT / DIANA!', color: 'text-amber-400', ms: reactionTimeMs });
    } else {
      gamerAudio.playClick();
      setLastShotFeedback({ text: '¡IMPACTO!', color: 'text-emerald-400', ms: reactionTimeMs });
    }

    const shotData: TrainingFlickShotData = {
      targetIndex: currentTargetIndex + 1,
      reactionTimeMs,
      distancePx: Math.round(distFromCenter),
      accuracyScore,
      isHit: true,
      isOvershoot,
      isUndershoot,
      offsetPx: Math.round(distFromCenter),
    };

    const newShots = [...shots, shotData];
    setShots(newShots);

    setTarget(null);

    if (currentTargetIndex + 1 >= totalTargets) {
      finishSession(newShots);
    } else {
      setTimeout(() => spawnNextTarget(currentTargetIndex + 1), 160);
    }
  };

  const finishSession = (finalShots: TrainingFlickShotData[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const validShots = finalShots.filter(s => s.isHit);
    const hits = validShots.length;
    const misses = finalShots.length - hits;

    const avgReactionTimeMs = validShots.length > 0
      ? Math.round(validShots.reduce((a, b) => a + b.reactionTimeMs, 0) / validShots.length)
      : config.activeWindowMs;

    const bestReactionTimeMs = validShots.length > 0
      ? Math.min(...validShots.map(s => s.reactionTimeMs))
      : config.activeWindowMs;

    const worstReactionTimeMs = validShots.length > 0
      ? Math.max(...finalShots.map(s => s.reactionTimeMs))
      : config.activeWindowMs;

    const avgAccuracyPercent = Math.round(
      finalShots.reduce((a, b) => a + b.accuracyScore, 0) / Math.max(1, finalShots.length)
    );

    // Consistency score (0-100) based on variance of times
    const times = validShots.map(s => s.reactionTimeMs);
    let variance = 0;
    if (times.length > 1) {
      const mean = avgReactionTimeMs;
      variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
    }
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(30, Math.min(100, Math.round(100 - stdDev * 0.4)));

    // Score calculation
    const accuracyFactor = (avgAccuracyPercent / 100) * 45;
    const speedFactor = Math.max(0, (1 - avgReactionTimeMs / 600) * 35);
    const consistencyFactor = (consistencyScore / 100) * 20;
    const rawScore = Math.round(accuracyFactor + speedFactor + consistencyFactor);
    const finalScore = Math.max(10, Math.min(100, rawScore));
    const rank = calculateTrainingRank(finalScore);

    const overshootCount = finalShots.filter(s => s.isOvershoot).length;
    const undershootCount = finalShots.filter(s => s.isUndershoot).length;

    const { recommendation, detectedTrend } = generateTrainingRecommendation(
      'flick',
      finalScore,
      avgReactionTimeMs,
      avgAccuracyPercent,
      consistencyScore,
      { overshoots: overshootCount, undershoots: undershootCount, difficulty }
    );

    const now = new Date();
    const record: TrainingSessionRecord = {
      id: `train_flick_${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${now.getDate()}/${now.getMonth() + 1}`,
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      module: 'flick',
      difficulty,
      routineId: routineContext?.routineId as any,
      routineStep: routineContext?.step,
      routineTotalSteps: routineContext?.totalSteps,
      score: finalScore,
      rank,
      reactionTimeMs: avgReactionTimeMs,
      bestReactionTimeMs,
      worstReactionTimeMs,
      accuracyPercent: avgAccuracyPercent,
      consistencyScore,
      hits,
      misses,
      totalRounds: totalTargets,
      overshootCount,
      undershootCount,
      detectedTrend,
      recommendation,
    };

    onComplete(record);
  };

  return (
    <div
      ref={arenaRef}
      className="relative w-full h-full bg-[#050508] border border-red-500/30 rounded-2xl overflow-hidden select-none flex flex-col justify-between"
    >
      {/* Top Header HUD */}
      <div className="p-3 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wider">ENTRENAMIENTO FLICK</span>
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
              Desplaza y toca con rapidez el centro de cada objetivo
            </p>
          </div>
        </div>

        {/* Progress & Live Feedback */}
        <div className="flex items-center gap-4">
          {lastShotFeedback && (
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs animate-fade-in">
              <span className={`font-bold ${lastShotFeedback.color}`}>{lastShotFeedback.text}</span>
              <span className="text-zinc-500">({lastShotFeedback.ms}ms)</span>
            </div>
          )}

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">OBJETIVO:</span>
            <span className="text-red-400 font-bold text-sm">
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

      {/* Arena Canvas Area */}
      <div className="relative flex-1 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,30,39,0.05)_0%,rgba(5,5,8,0.95)_100%)] overflow-hidden cursor-crosshair">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Center Guide Marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-zinc-800/60 pointer-events-none flex items-center justify-center">
          <div className="w-1 h-1 bg-red-500/40 rounded-full" />
        </div>

        {/* Countdown Overlay */}
        {isCountdown && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
            <div className="text-zinc-500 font-mono text-xs mb-2 tracking-widest uppercase">
              PREPARANDO PRUEBA DE FLICK...
            </div>
            <div className="text-7xl font-mono font-black text-red-500 animate-ping">
              {countdownNum > 0 ? countdownNum : '¡YA!'}
            </div>
          </div>
        )}

        {/* Active Target */}
        {!isCountdown && target && (
          <div
            id="flick-target-active"
            onClick={handleTargetHit}
            onTouchStart={handleTargetHit}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.radius * 2}px`,
              height: `${target.radius * 2}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-95 group"
          >
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full bg-red-600/20 border-2 border-red-500 animate-pulse shadow-[0_0_15px_rgba(255,30,39,0.7)] flex items-center justify-center">
              {/* Mid Ring */}
              <div className="w-2/3 h-2/3 rounded-full bg-white/20 border border-white/80 flex items-center justify-center">
                {/* Bulls-eye Core */}
                <div className="w-1/2 h-1/2 rounded-full bg-red-600 shadow-[0_0_8px_#ff1e27]" />
              </div>
            </div>

            {/* Target Crosshair Lines */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-red-400/60 pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-red-400/60 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Bottom Status Ribbon */}
      <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Aciertos: <strong className="text-emerald-400">{shots.filter(s => s.isHit).length}</strong></span>
          <span>Fallos: <strong className="text-red-400">{shots.filter(s => !s.isHit).length}</strong></span>
          <span>Ventana Activa: <strong className="text-zinc-300">{config.activeWindowMs}ms</strong></span>
        </div>
        <div className="text-zinc-600">SENSI 33 TACTICAL AIM TRAINING</div>
      </div>
    </div>
  );
}
