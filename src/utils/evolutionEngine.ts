import {
  CalibrationRecord,
  EvolutionChartDataPoint,
  EvolutionTrendStatus,
  EvolutionTrendResult,
  EvolutionSummaryStats,
  EvolutionGoals,
  EvolutionStreak,
  EvolutionComparisonMetric,
} from '../types';

export const DEFAULT_EVOLUTION_GOALS: EvolutionGoals = {
  targetScore: 85,
  targetReactionTimeMs: 120,
  targetAccuracyPercent: 82,
  targetConsistencyPercent: 78,
};

/**
 * Computes overall summary statistics for all calibration sessions
 */
export function computeEvolutionSummary(records: CalibrationRecord[]): EvolutionSummaryStats {
  if (!records || records.length === 0) {
    return {
      bestScore: 0,
      avgScore: 0,
      bestReactionTimeMs: 0,
      avgReactionTimeMs: 0,
      avgAccuracyPercent: 0,
      avgConsistencyPercent: 0,
      totalSessions: 0,
    };
  }

  let totalScore = 0;
  let bestScore = 0;
  let totalTime = 0;
  let minTime = 9999;
  let totalAcc = 0;
  let totalCons = 0;

  for (const r of records) {
    const score = r.finalScore || 0;
    const time = r.testMetrics?.avgReactionTimeMs || 150;
    const acc = r.testMetrics?.avgAccuracy || 0;
    const cons = r.testMetrics?.consistencyScore || 0;

    totalScore += score;
    if (score > bestScore) bestScore = score;

    totalTime += time;
    if (time > 0 && time < minTime) minTime = time;

    totalAcc += acc;
    totalCons += cons;
  }

  const count = records.length;

  return {
    bestScore: Math.round(bestScore),
    avgScore: Math.round(totalScore / count),
    bestReactionTimeMs: minTime === 9999 ? 0 : Math.round(minTime),
    avgReactionTimeMs: Math.round(totalTime / count),
    avgAccuracyPercent: Math.round(totalAcc / count),
    avgConsistencyPercent: Math.round(totalCons / count),
    totalSessions: count,
  };
}

/**
 * Detects whether the user is MEJORANDO, ESTABLE, EMPEORANDO or DATOS INSUFICIENTES
 */
export function computeEvolutionTrend(records: CalibrationRecord[]): EvolutionTrendResult {
  if (!records || records.length < 3) {
    return {
      status: 'DATOS INSUFICIENTES',
      statusColor: 'text-zinc-400',
      scoreDiff: 0,
      reactionDiffMs: 0,
      accuracyDiffPct: 0,
      consistencyDiffPct: 0,
      description: 'Se requieren al menos 3 sesiones registradas para calcular la tendencia estadística.',
      sampleSize: records ? records.length : 0,
    };
  }

  // records[0] is newest, records[last] is oldest
  const chronological = [...records].reverse();
  const n = chronological.length;

  // Split into recent window (last half or last 3) and prior window
  const windowSize = Math.min(3, Math.floor(n / 2));
  const recentSlice = chronological.slice(n - windowSize);
  const priorSlice = chronological.slice(n - windowSize * 2, n - windowSize);

  const avgRecentScore = recentSlice.reduce((s, r) => s + r.finalScore, 0) / windowSize;
  const avgPriorScore = priorSlice.reduce((s, r) => s + r.finalScore, 0) / priorSlice.length;

  const avgRecentTime = recentSlice.reduce((s, r) => s + (r.testMetrics?.avgReactionTimeMs || 150), 0) / windowSize;
  const avgPriorTime = priorSlice.reduce((s, r) => s + (r.testMetrics?.avgReactionTimeMs || 150), 0) / priorSlice.length;

  const avgRecentAcc = recentSlice.reduce((s, r) => s + (r.testMetrics?.avgAccuracy || 70), 0) / windowSize;
  const avgPriorAcc = priorSlice.reduce((s, r) => s + (r.testMetrics?.avgAccuracy || 70), 0) / priorSlice.length;

  const avgRecentCons = recentSlice.reduce((s, r) => s + (r.testMetrics?.consistencyScore || 65), 0) / windowSize;
  const avgPriorCons = priorSlice.reduce((s, r) => s + (r.testMetrics?.consistencyScore || 65), 0) / priorSlice.length;

  const scoreDiff = Math.round((avgRecentScore - avgPriorScore) * 10) / 10;
  const reactionDiffMs = Math.round(avgRecentTime - avgPriorTime);
  const accuracyDiffPct = Math.round((avgRecentAcc - avgPriorAcc) * 10) / 10;
  const consistencyDiffPct = Math.round((avgRecentCons - avgPriorCons) * 10) / 10;

  let status: EvolutionTrendStatus = 'ESTABLE';
  let statusColor = 'text-yellow-400';
  let description = 'Tu rendimiento se mantiene equilibrado con variaciones mínimas entre sesiones.';

  if (scoreDiff >= 2.5 || (scoreDiff >= 0.5 && reactionDiffMs <= -8 && accuracyDiffPct >= 2)) {
    status = 'MEJORANDO';
    statusColor = 'text-emerald-400';
    description = `Tu score ha subido +${scoreDiff} pts en promedio y tu precisión mejoró +${accuracyDiffPct}%.`;
  } else if (scoreDiff <= -3 || (scoreDiff <= -1 && reactionDiffMs >= 15 && accuracyDiffPct <= -4)) {
    status = 'EMPEORANDO';
    statusColor = 'text-red-400';
    description = `Tu score disminuyó ${scoreDiff} pts en las últimas sesiones. Revisa tu postura y levantamiento de mira.`;
  }

  return {
    status,
    statusColor,
    scoreDiff,
    reactionDiffMs,
    accuracyDiffPct,
    consistencyDiffPct,
    description,
    sampleSize: n,
  };
}

/**
 * Computes consecutive session streak where score improves or maintains
 */
export function computeEvolutionStreak(records: CalibrationRecord[]): EvolutionStreak {
  if (!records || records.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      isActive: false,
      streakStatusText: 'Sin sesiones registradas',
    };
  }

  if (records.length === 1) {
    return {
      currentStreak: 1,
      bestStreak: 1,
      isActive: true,
      streakStatusText: '1 sesión inicial completada',
    };
  }

  // records[0] is newest. Chronological order is oldest to newest:
  const chrono = [...records].reverse();
  
  // Calculate historical best streak
  let maxStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < chrono.length; i++) {
    const prevScore = chrono[i - 1].finalScore;
    const currScore = chrono[i].finalScore;

    // Score improves or maintains (>= prevScore - 1 tolerance)
    if (currScore >= prevScore - 1) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current active streak from newest backward
  let activeStreak = 1;
  for (let i = 0; i < records.length - 1; i++) {
    const newerScore = records[i].finalScore;
    const olderScore = records[i + 1].finalScore;

    if (newerScore >= olderScore - 1) {
      activeStreak++;
    } else {
      // Streak broken at previous step
      if (i === 0) {
        activeStreak = 1; // latest was worse than preceding
      }
      break;
    }
  }

  const isPositive = activeStreak > 1;

  return {
    currentStreak: activeStreak,
    bestStreak: Math.max(maxStreak, activeStreak),
    isActive: isPositive,
    streakStatusText: isPositive
      ? `🔥 ${activeStreak} SESIONES CONSECUTIVAS MEJORANDO / MANTENIENDO`
      : 'Racha reiniciada tras la última sesión',
  };
}

/**
 * Compares: Última sesión vs. Mejor sesión vs. Promedio
 */
export function computeEvolutionComparison(records: CalibrationRecord[]): EvolutionComparisonMetric[] {
  if (!records || records.length === 0) {
    return [];
  }

  const summary = computeEvolutionSummary(records);
  const last = records[0];

  // Find best record
  let best = records[0];
  for (const r of records) {
    if (r.finalScore > best.finalScore) {
      best = r;
    }
  }

  const lastScore = last.finalScore || 0;
  const bestScore = best.finalScore || 0;
  const avgScore = summary.avgScore;

  const lastTime = last.testMetrics?.avgReactionTimeMs || 0;
  const bestTime = best.testMetrics?.avgReactionTimeMs || 0;
  const avgTime = summary.avgReactionTimeMs;

  const lastAcc = last.testMetrics?.avgAccuracy || 0;
  const bestAcc = best.testMetrics?.avgAccuracy || 0;
  const avgAcc = summary.avgAccuracyPercent;

  const lastCons = last.testMetrics?.consistencyScore || 0;
  const bestCons = best.testMetrics?.consistencyScore || 0;
  const avgCons = summary.avgConsistencyPercent;

  const lastGen = last.initialSensi?.general || 0;
  const bestGen = best.initialSensi?.general || 0;
  const avgGen = Math.round(records.reduce((s, r) => s + (r.initialSensi?.general || 0), 0) / records.length);

  const lastRed = last.initialSensi?.redDot || 0;
  const bestRed = best.initialSensi?.redDot || 0;
  const avgRed = Math.round(records.reduce((s, r) => s + (r.initialSensi?.redDot || 0), 0) / records.length);

  return [
    {
      label: 'SCORE DE CALIBRACIÓN',
      lastValue: lastScore,
      bestValue: bestScore,
      avgValue: avgScore,
      unit: 'pts',
      diffLastVsBest: lastScore - bestScore,
      diffLastVsAvg: lastScore - avgScore,
      isHigherBetter: true,
    },
    {
      label: 'TIEMPO DE REACCIÓN',
      lastValue: lastTime,
      bestValue: bestTime,
      avgValue: avgTime,
      unit: 'ms',
      diffLastVsBest: lastTime - bestTime,
      diffLastVsAvg: lastTime - avgTime,
      isHigherBetter: false, // Lower ms is better
    },
    {
      label: 'PRECISIÓN DE FLICK',
      lastValue: lastAcc,
      bestValue: bestAcc,
      avgValue: avgAcc,
      unit: '%',
      diffLastVsBest: lastAcc - bestAcc,
      diffLastVsAvg: lastAcc - avgAcc,
      isHigherBetter: true,
    },
    {
      label: 'CONSISTENCIA DE LEVANTAMIENTO',
      lastValue: lastCons,
      bestValue: bestCons,
      avgValue: avgCons,
      unit: '%',
      diffLastVsBest: lastCons - bestCons,
      diffLastVsAvg: lastCons - avgCons,
      isHigherBetter: true,
    },
    {
      label: 'SENSIBILIDAD GENERAL',
      lastValue: lastGen,
      bestValue: bestGen,
      avgValue: avgGen,
      unit: '/ 200',
      diffLastVsBest: lastGen - bestGen,
      diffLastVsAvg: lastGen - avgGen,
      isHigherBetter: true,
    },
    {
      label: 'SENSIBILIDAD PUNTO ROJO',
      lastValue: lastRed,
      bestValue: bestRed,
      avgValue: avgRed,
      unit: '/ 200',
      diffLastVsBest: lastRed - bestRed,
      diffLastVsAvg: lastRed - avgRed,
      isHigherBetter: true,
    },
  ];
}

/**
 * Generate factual recommendations based purely on recorded data
 */
export function generateEvolutionRecommendations(
  records: CalibrationRecord[],
  trend: EvolutionTrendResult,
  streak: EvolutionStreak,
  summary: EvolutionSummaryStats
): string[] {
  const tips: string[] = [];

  if (!records || records.length === 0) {
    tips.push('Aún no tienes sesiones registradas. Realiza tu primera calibración en el Calibrador Inteligente para inicializar tu gráfico evolutivo.');
    tips.push('Todas las métricas de reacción, precisión y consistencia se analizarán dentro de SENSI 33 con 100% de privacidad local.');
    return tips;
  }

  if (records.length < 3) {
    tips.push(`Has completado ${records.length} sesión(es). Realiza ${3 - records.length} sesión(es) adicional(es) para desbloquear el cálculo de tendencia.`);
    tips.push('Mantén la misma postura de agarre y posición de manos durante los primeros tests para una línea base limpia.');
    return tips;
  }

  // Trend-based insights
  if (trend.status === 'MEJORANDO') {
    tips.push(`Tu rendimiento está mejorando (+${trend.scoreDiff > 0 ? '+' : ''}${trend.scoreDiff} pts de score). Tu precisión ha variado un ${trend.accuracyDiffPct >= 0 ? '+' : ''}${trend.accuracyDiffPct}%.`);
  } else if (trend.status === 'EMPEORANDO') {
    tips.push(`Tu score reciente ha disminuido (${trend.scoreDiff} pts). Si sientes la mira pesada o con overshoot, aplica un micro-ajuste de ±1 a ±2 en General.`);
  } else {
    tips.push('Tu rendimiento es muy estable. La memoria muscular está fijando tus puntos de tiro.');
  }

  // Streak-based advice
  if (streak.currentStreak >= 3) {
    tips.push(`¡Racha activa de 🔥 ${streak.currentStreak} sesiones consecutivas mejorando o manteniendo score! No cambies demasiado la sensibilidad todavía.`);
  } else if (records.length >= 6) {
    tips.push('Historial amplio disponible: Revisa tus gráficos de 10, 20 o 30 sesiones para identificar fatiga en sesiones largas.');
  }

  // Reaction vs accuracy synergy
  if (summary.avgReactionTimeMs > 0 && summary.avgReactionTimeMs < 125) {
    tips.push(`Excelente tiempo de reacción promedio (${summary.avgReactionTimeMs} ms). Posees reflejos rápidos acordes al estándar de 120Hz.`);
  } else if (summary.avgReactionTimeMs > 180) {
    tips.push(`Tu tiempo de reacción promedio es de ${summary.avgReactionTimeMs} ms. Considera practicar levantamientos más directos desde el botón de disparo.`);
  }

  if (summary.avgAccuracyPercent >= 80) {
    tips.push(`Alta precisión registrada (${summary.avgAccuracyPercent}%). Tu control vertical sobre el eje Y es consistente.`);
  }

  return tips;
}

/**
 * Format chart data with 10, 20, 30 session limit
 */
export function formatEvolutionChartData(
  records: CalibrationRecord[],
  limit: number = 30
): EvolutionChartDataPoint[] {
  if (!records || records.length === 0) return [];

  // records[0] is newest. Reverse to chronological order (oldest to newest):
  const chrono = [...records].reverse();
  const sliced = chrono.slice(Math.max(0, chrono.length - limit));

  return sliced.map((item, idx) => {
    let dateStr = 'Sesión';
    let timeStr = '';
    try {
      if (item.timestamp) {
        const d = new Date(item.timestamp);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else {
          dateStr = item.timestamp.split(' ')[0] || `S${idx + 1}`;
          timeStr = item.timestamp.split(' ')[1] || '';
        }
      }
    } catch {
      dateStr = `S${idx + 1}`;
    }

    return {
      index: idx + 1,
      testId: item.id,
      timestamp: item.timestamp,
      dateLabel: dateStr,
      timeLabel: timeStr,
      reactionTimeMs: item.testMetrics?.avgReactionTimeMs || 150,
      accuracyPercent: item.testMetrics?.avgAccuracy || 70,
      consistencyScore: item.testMetrics?.consistencyScore || 65,
      calibrationScore: item.finalScore || 75,
      weapon: item.playerProfile?.mainWeapon || 'escopeta',
      hud: item.playerProfile?.hudFingers || '3',
      device: item.playerProfile?.deviceModel || 'iPhone',
      generalSensi: item.initialSensi?.general || 180,
    };
  });
}
