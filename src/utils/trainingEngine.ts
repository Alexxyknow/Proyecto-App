// SENSI 33 Training Center Logic & Analytics Engine
import {
  TrainingModuleId,
  TrainingDifficulty,
  TrainingRoutineId,
  TrainingRoutineConfig,
  TrainingScoreRank,
  TrainingSessionRecord,
  TrainingRecordsSummary,
} from '../types';

export const TRAINING_STORAGE_KEY = 'sensi33_training_sessions_v1';
export const TRAINING_RECORDS_KEY = 'sensi33_training_records_v1';

// Difficulty Configurations
export interface DifficultySettings {
  name: string;
  badgeColor: string;
  targetRadiusPx: number; // radius of target circle
  activeWindowMs: number; // max time before target expires
  reactionMinWaitMs: number;
  reactionMaxWaitMs: number;
  flickDistanceFactor: number; // 0.6 to 1.0 of container bounds
  precisionMinRadiusPx: number;
  precisionMaxRadiusPx: number;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<TrainingDifficulty, DifficultySettings> = {
  facil: {
    name: 'FÁCIL',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    targetRadiusPx: 36, // 72px diameter
    activeWindowMs: 2500,
    reactionMinWaitMs: 1500,
    reactionMaxWaitMs: 3500,
    flickDistanceFactor: 0.65,
    precisionMinRadiusPx: 26,
    precisionMaxRadiusPx: 38,
    description: 'Objetivos amplios y ventana de tiempo generosa. Ideal para calentamiento y adaptación inicial.',
  },
  normal: {
    name: 'NORMAL',
    badgeColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/40',
    targetRadiusPx: 26, // 52px diameter
    activeWindowMs: 1700,
    reactionMinWaitMs: 1200,
    reactionMaxWaitMs: 3000,
    flickDistanceFactor: 0.8,
    precisionMinRadiusPx: 18,
    precisionMaxRadiusPx: 30,
    description: 'Parámetros competitivos estándar. Velocidad y precisión equilibrada para duelos reales.',
  },
  dificil: {
    name: 'DIFÍCIL',
    badgeColor: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
    targetRadiusPx: 18, // 36px diameter
    activeWindowMs: 1150,
    reactionMinWaitMs: 900,
    reactionMaxWaitMs: 2400,
    flickDistanceFactor: 0.92,
    precisionMinRadiusPx: 12,
    precisionMaxRadiusPx: 22,
    description: 'Objetivos reducidos y respuesta rápida. Exige alta micro-precisión y reflejos táctiles.',
  },
  extremo: {
    name: 'EXTREMO',
    badgeColor: 'text-red-500 border-red-500/60 bg-red-950/60 shadow-[0_0_12px_rgba(255,30,39,0.4)]',
    targetRadiusPx: 13, // 26px diameter
    activeWindowMs: 800,
    reactionMinWaitMs: 600,
    reactionMaxWaitMs: 1800,
    flickDistanceFactor: 1.0,
    precisionMinRadiusPx: 8,
    precisionMaxRadiusPx: 16,
    description: 'Micro-objetivos y ventana ultrarrápida. Solo para jugadores que dominan el levantamiento de mira veloz.',
  },
};

// Rutinas Preconfiguradas
export const ROUTINES_CONFIG: Record<TrainingRoutineId, TrainingRoutineConfig> = {
  routine_5min: {
    id: 'routine_5min',
    name: '5 MIN — RÁPIDA',
    durationLabel: '5 Minutos',
    description: 'Calentamiento ágil enfocado en activar reflejos musculares y velocidad de reacción.',
    badgeIcon: '⚡',
    modules: [
      { moduleId: 'reaction', difficulty: 'normal', reps: 10, title: 'Reacción Refleja' },
      { moduleId: 'flick', difficulty: 'normal', reps: 10, title: 'Flick & Levantamiento' },
    ],
  },
  routine_10min: {
    id: 'routine_10min',
    name: '10 MIN — COMPLETA',
    durationLabel: '10 Minutos',
    description: 'Sesión integral que cubre los cuatro pilares del apuntado competitivo: Reacción, Flick, Precisión y Consistencia.',
    badgeIcon: '🎯',
    modules: [
      { moduleId: 'reaction', difficulty: 'normal', reps: 10, title: 'Reacción Refleja' },
      { moduleId: 'flick', difficulty: 'dificil', reps: 10, title: 'Flick Pro' },
      { moduleId: 'precision', difficulty: 'normal', reps: 10, title: 'Micro-Precisión' },
      { moduleId: 'consistency', difficulty: 'normal', reps: 12, title: 'Control de Fatiga' },
    ],
  },
  routine_15min: {
    id: 'routine_15min',
    name: '15 MIN — PRO',
    durationLabel: '15 Minutos',
    description: 'Entrenamiento de alto rendimiento para torneos. Máxima exigencia de precisión y resistencia muscular sostenida.',
    badgeIcon: '🔥',
    modules: [
      { moduleId: 'reaction', difficulty: 'dificil', reps: 10, title: 'Reacción Extrema' },
      { moduleId: 'flick', difficulty: 'dificil', reps: 12, title: 'Flicks a Larga Distancia' },
      { moduleId: 'precision', difficulty: 'extremo', reps: 12, title: 'Puntería Quirúrgica' },
      { moduleId: 'consistency', difficulty: 'dificil', reps: 16, title: 'Resistencia & Consistencia Pro' },
    ],
  },
};

// Rank calculation
export function calculateTrainingRank(score: number): TrainingScoreRank {
  if (score >= 93) return 'S+';
  if (score >= 85) return 'S';
  if (score >= 74) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

export function getRankColor(rank: TrainingScoreRank): string {
  switch (rank) {
    case 'S+':
      return 'text-amber-300 border-amber-400 bg-amber-950/60 shadow-[0_0_12px_rgba(251,191,36,0.4)]';
    case 'S':
      return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
    case 'A':
      return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
    case 'B':
      return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40';
    case 'C':
    default:
      return 'text-red-400 border-red-500/50 bg-red-950/40';
  }
}

// Module display metadata
export const TRAINING_MODULE_META: Record<
  TrainingModuleId,
  {
    title: string;
    iconSymbol: string;
    tagline: string;
    description: string;
    color: string;
    accentColor: string;
    borderColor: string;
  }
> = {
  flick: {
    title: 'FLICK',
    iconSymbol: '🎯',
    tagline: 'Levantamiento & Desplazamiento Rápido',
    description: 'Mide la velocidad y precisión al desplazar la mira hacia objetivos en diferentes posiciones, evaluando overshoot y undershoot.',
    color: 'text-red-400',
    accentColor: '#ff1e27',
    borderColor: 'border-red-500/40',
  },
  reaction: {
    title: 'REACCIÓN',
    iconSymbol: '⚡',
    tagline: 'Tiempo de Respuesta Táctil',
    description: 'Evalúa la rapidez motora al detectar un estímulo visual imprevisto, descartando anticipaciones tempranas.',
    color: 'text-yellow-400',
    accentColor: '#facc15',
    borderColor: 'border-yellow-500/40',
  },
  precision: {
    title: 'PRECISIÓN',
    iconSymbol: '🎯',
    tagline: 'Micro-Ajuste & Concentración',
    description: 'Entrena el impacto en dianas decrecientes de diferentes tamaños bajo cronómetro estricto.',
    color: 'text-emerald-400',
    accentColor: '#34d399',
    borderColor: 'border-emerald-500/40',
  },
  consistency: {
    title: 'CONSISTENCIA',
    iconSymbol: '🧠',
    tagline: 'Control de Fatiga & Memoria Muscular',
    description: 'Comprueba si mantienes la misma velocidad y precisión durante toda la serie o si tu rendimiento decae por fatiga.',
    color: 'text-cyan-400',
    accentColor: '#22d3ee',
    borderColor: 'border-cyan-500/40',
  },
};

// Generador de Recomendaciones Basadas en Datos Reales
export function generateTrainingRecommendation(
  module: TrainingModuleId,
  score: number,
  avgTimeMs: number,
  accuracyPct: number,
  consistencyPct: number,
  extra: {
    overshoots?: number;
    undershoots?: number;
    earlyTaps?: number;
    accuracyVariation?: number;
    timeVariation?: number;
    difficulty: TrainingDifficulty;
  }
): { recommendation: string; detectedTrend: string } {
  let recommendation = '';
  let detectedTrend = '';

  if (module === 'flick') {
    const overshoots = extra.overshoots || 0;
    const undershoots = extra.undershoots || 0;

    if (overshoots > undershoots + 2) {
      detectedTrend = 'Tendencia a Overshoot (Paso de largo)';
      recommendation = `Tu levantamiento es rápido pero sobrepasas el centro del objetivo (${overshoots} veces). Se recomienda reducir 3–5 puntos la sensibilidad General en tu configuración para estabilizar el freno muscular.`;
    } else if (undershoots > overshoots + 2) {
      detectedTrend = 'Tendencia a Undershoot (Te quedas corto)';
      recommendation = `Te estás quedando corto del centro del objetivo (${undershoots} veces). Se recomienda subir 4–6 puntos la sensibilidad General o aumentar la velocidad del swipe inicial.`;
    } else if (avgTimeMs < 140 && accuracyPct >= 80) {
      detectedTrend = 'Flick Competitivo de Élite';
      recommendation = `Excelente sincronización entre velocidad (${avgTimeMs} ms) y precisión (${accuracyPct}%). Mantén este agarre táctil y prueba en dificultad Difícil o Extrema.`;
    } else if (accuracyPct < 70) {
      detectedTrend = 'Desvío en Trayectoria de Flick';
      recommendation = 'Tu velocidad es adecuada, pero la trayectoria del movimiento pierde el centro. Practica movimientos más rectilíneos y reduce ligeramente la velocidad inicial para priorizar el impacto.';
    } else {
      detectedTrend = 'Flick Equilibrado';
      recommendation = `Rendimiento balanceado con ${accuracyPct}% de precisión. Continúa practicando en esta dificultad para consolidar la memoria muscular.`;
    }
  } else if (module === 'reaction') {
    const early = extra.earlyTaps || 0;

    if (early >= 2) {
      detectedTrend = 'Anticipación y Ansiedad Motora';
      recommendation = `Se registraron ${early} toques anticipados. Espera a confirmar visualmente el objetivo en pantalla antes de iniciar el contacto táctil para evitar fallos en combate.`;
    } else if (avgTimeMs <= 130) {
      detectedTrend = 'Tiempo de Reacción Nivel Pro';
      recommendation = `Reflejos excepcionales (${avgTimeMs} ms). Estás en el 5% superior de velocidad táctil. Excelente para duelos uno contra uno con escopeta o SMG.`;
    } else if (avgTimeMs <= 180) {
      detectedTrend = 'Reacción Rápida y Estable';
      recommendation = `Tu tiempo de respuesta (${avgTimeMs} ms) es óptimo y consistente. Intenta realizar sesiones en dificultad Difícil para reducir los últimos 20 ms.`;
    } else {
      detectedTrend = 'Margen de Mejora en Reflejo Visual';
      recommendation = `Tiempo promedio de ${avgTimeMs} ms. Realiza la rutina de 5 minutos antes de jugar para activar los neurotransmisores y la respuesta táctil.`;
    }
  } else if (module === 'precision') {
    if (accuracyPct >= 90) {
      detectedTrend = 'Puntería de Alta Definición';
      recommendation = `Precisión sobresaliente (${accuracyPct}%). Tienes un excelente control en micro-zonas. Te beneficiarás de sensibilidades más altas en mira 2X y 4X.`;
    } else if (accuracyPct >= 75) {
      detectedTrend = 'Precisión Competitiva';
      recommendation = `Buen porcentaje de acierto (${accuracyPct}%). Para aumentar al rango S+, concéntrate en no apresurar el toque en los objetivos más pequeños.`;
    } else {
      detectedTrend = 'Inestabilidad en Micro-Ajustes';
      recommendation = `Tu precisión actual es de ${accuracyPct}%. Sugerimos bajar levemente el tamaño de tu botón de disparo o ajustar la sensibilidad Punto Rojo para ganar mayor área táctil.`;
    }
  } else {
    // consistency
    const accVar = extra.accuracyVariation || 0;
    const timeVar = extra.timeVariation || 0;

    if (accVar <= -8 || timeVar >= 30) {
      detectedTrend = 'Fatiga Motora Detectada';
      recommendation = `Tu rendimiento decayó en la segunda mitad (${accVar > 0 ? '+' : ''}${accVar}% precisión, +${timeVar} ms de retardo). Se recomienda descansar las manos 2 minutos entre partidas largas para evitar fatiga articular.`;
    } else if (Math.abs(accVar) <= 4 && Math.abs(timeVar) <= 15) {
      detectedTrend = 'Consistencia Impecable';
      recommendation = `Excelente retención de rendimiento (${consistencyPct}% de consistencia). Mantuviste casi idéntica velocidad y precisión de principio a fin. Tu memoria muscular está consolidada.`;
    } else {
      detectedTrend = 'Estabilidad Moderada';
      recommendation = `Consistencia general del ${consistencyPct}%. Practica series de 15 repeticiones para aumentar tu resistencia muscular sostenida.`;
    }
  }

  return { recommendation, detectedTrend };
}

// Local Storage Management
export function getSavedTrainingSessions(): TrainingSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRAINING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrainingSession(record: TrainingSessionRecord): TrainingSessionRecord[] {
  if (typeof window === 'undefined') return [record];
  try {
    const existing = getSavedTrainingSessions();
    const updated = [record, ...existing.slice(0, 199)]; // Keep up to 200 sessions
    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(updated));
    updateTrainingRecordsSummary(updated);
    return updated;
  } catch {
    return [record];
  }
}

export function deleteTrainingSession(id: string): TrainingSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getSavedTrainingSessions();
    const updated = existing.filter(s => s.id !== id);
    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(updated));
    updateTrainingRecordsSummary(updated);
    return updated;
  } catch {
    return [];
  }
}

export function clearTrainingHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRAINING_STORAGE_KEY);
    localStorage.removeItem(TRAINING_RECORDS_KEY);
  } catch {}
}

export function getSavedTrainingRecords(): TrainingRecordsSummary {
  const defaultSummary: TrainingRecordsSummary = {
    bestFlickScore: 0,
    bestFlickTimeMs: 0,
    bestReactionMs: 0,
    bestPrecisionPercent: 0,
    bestConsistencyScore: 0,
    bestGlobalScore: 0,
    totalTrainingSessions: 0,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return defaultSummary;
  try {
    const raw = localStorage.getItem(TRAINING_RECORDS_KEY);
    if (!raw) return defaultSummary;
    return { ...defaultSummary, ...JSON.parse(raw) };
  } catch {
    return defaultSummary;
  }
}

export function updateTrainingRecordsSummary(sessions: TrainingSessionRecord[]): TrainingRecordsSummary {
  let bestFlickScore = 0;
  let bestFlickTimeMs = 9999;
  let bestReactionMs = 9999;
  let bestPrecisionPercent = 0;
  let bestConsistencyScore = 0;
  let bestGlobalScore = 0;

  sessions.forEach(s => {
    if (s.score > bestGlobalScore) bestGlobalScore = s.score;

    if (s.module === 'flick') {
      if (s.score > bestFlickScore) bestFlickScore = s.score;
      if (s.bestReactionTimeMs > 0 && s.bestReactionTimeMs < bestFlickTimeMs) {
        bestFlickTimeMs = s.bestReactionTimeMs;
      }
    } else if (s.module === 'reaction') {
      if (s.bestReactionTimeMs > 0 && s.bestReactionTimeMs < bestReactionMs) {
        bestReactionMs = s.bestReactionTimeMs;
      }
    } else if (s.module === 'precision') {
      if (s.accuracyPercent > bestPrecisionPercent) {
        bestPrecisionPercent = s.accuracyPercent;
      }
    } else if (s.module === 'consistency') {
      if (s.consistencyScore > bestConsistencyScore) {
        bestConsistencyScore = s.consistencyScore;
      }
    }
  });

  const summary: TrainingRecordsSummary = {
    bestFlickScore,
    bestFlickTimeMs: bestFlickTimeMs === 9999 ? 0 : bestFlickTimeMs,
    bestReactionMs: bestReactionMs === 9999 ? 0 : bestReactionMs,
    bestPrecisionPercent,
    bestConsistencyScore,
    bestGlobalScore,
    totalTrainingSessions: sessions.length,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TRAINING_RECORDS_KEY, JSON.stringify(summary));
    } catch {}
  }

  return summary;
}
