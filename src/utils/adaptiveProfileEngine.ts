import {
  CalibrationRecord,
  CalibrationSensiConfig,
  ConfidenceAssessment,
  ConfidenceTier,
  PlayerTrendAnalysis,
  AdaptiveAdjustment,
  WeaponSensiProfilesMap,
  DeviceAdaptiveProfile,
  EvolutionChartDataPoint,
} from '../types';

export const DEFAULT_WEAPON_PROFILES: WeaponSensiProfilesMap = {
  escopeta: { general: 194, redDot: 188, scope2x: 178, scope4x: 166, sniperScope: 120, freeLook: 150 },
  smg: { general: 188, redDot: 182, scope2x: 172, scope4x: 158, sniperScope: 122, freeLook: 145 },
  ar: { general: 182, redDot: 170, scope2x: 164, scope4x: 152, sniperScope: 110, freeLook: 140 },
  sniper: { general: 174, redDot: 158, scope2x: 148, scope4x: 136, sniperScope: 92, freeLook: 130 },
  onetap: { general: 196, redDot: 190, scope2x: 180, scope4x: 168, sniperScope: 120, freeLook: 152 },
};

export const clamp200 = (val: number): number => Math.min(200, Math.max(0, Math.round(val)));

/**
 * Assess statistical confidence tier based on real test count in SENSI 33
 */
export function assessConfidence(testCount: number): ConfidenceAssessment {
  if (testCount <= 0) {
    return {
      tier: 'insufficient',
      label: 'Datos insuficientes',
      testCount: 0,
      percentage: 0,
      description: 'Aún no has realizado pruebas. Realiza tests de flick para generar tu perfil adaptativo.',
    };
  }
  if (testCount <= 2) {
    return {
      tier: 'insufficient',
      label: 'Datos insuficientes',
      testCount,
      percentage: Math.round((testCount / 3) * 33),
      description: 'Muestra reducida (1–2 pruebas). Realiza al menos 3 calibraciones para desbloquear tendencias consistentes.',
    };
  }
  if (testCount <= 5) {
    return {
      tier: 'low',
      label: 'Confianza baja',
      testCount,
      percentage: 35 + Math.round(((testCount - 3) / 2) * 25),
      description: 'Tendencia inicial detectada. Se aconseja acumular 6 o más pruebas para mayor precisión.',
    };
  }
  if (testCount <= 9) {
    return {
      tier: 'medium',
      label: 'Confianza media',
      testCount,
      percentage: 65 + Math.round(((testCount - 6) / 3) * 20),
      description: 'Muestreo sólido. Las recomendaciones tienen buena correlación con tu memoria muscular.',
    };
  }
  return {
    tier: 'high',
    label: 'Confianza alta',
    testCount,
    percentage: 95 + Math.min(5, testCount - 10),
    description: 'Historial amplio (10+ pruebas). Máxima fiabilidad estadística para ajustes competitivos.',
  };
}

/**
 * Detect real player trends exclusively from actual SENSI 33 calibration tests
 */
export function analyzePlayerTrends(history: CalibrationRecord[]): PlayerTrendAnalysis {
  if (!history || history.length === 0) {
    return {
      flickSpeed: 'normal',
      overshootBehavior: 'balanced',
      consistencyGrade: 'moderate',
      precisionGrade: 'good',
      primaryTrendTitle: 'Sin datos de calibración suficientes',
      primaryRecommendation: 'Inicia tu primer test en el Calibrador Inteligente para perfilar tu agarre.',
      detectedLabels: ['Sin pruebas registradas'],
      avgReactionTimeMs: 0,
      avgAccuracyPercent: 0,
      avgConsistencyPercent: 0,
      bestCalibrationScore: 0,
    };
  }

  // Calculate averages across session summaries
  const count = history.length;
  let totalTime = 0;
  let totalAccuracy = 0;
  let totalConsistency = 0;
  let totalOvershoot = 0;
  let bestScore = 0;

  for (const rec of history) {
    if (rec.testMetrics) {
      totalTime += rec.testMetrics.avgReactionTimeMs || 0;
      totalAccuracy += rec.testMetrics.avgAccuracy || 0;
      totalConsistency += rec.testMetrics.consistencyScore || 0;
      totalOvershoot += rec.testMetrics.avgOvershootPx || 0;
    }
    if (rec.finalScore && rec.finalScore > bestScore) {
      bestScore = rec.finalScore;
    }
  }

  const avgTime = Math.round(totalTime / count);
  const avgAccuracy = Math.round(totalAccuracy / count);
  const avgConsistency = Math.round(totalConsistency / count);
  const avgOvershoot = Math.round(totalOvershoot / count);

  // Speed categorization
  let flickSpeed: 'slow' | 'normal' | 'fast' = 'normal';
  if (avgTime > 175) flickSpeed = 'slow';
  else if (avgTime < 105) flickSpeed = 'fast';

  // Overshoot categorization
  let overshootBehavior: 'undershoot' | 'balanced' | 'overshoot' = 'balanced';
  if (avgOvershoot > 25) overshootBehavior = 'overshoot';
  else if (avgOvershoot < -25) overshootBehavior = 'undershoot';

  // Consistency categorization
  let consistencyGrade: 'inconsistent' | 'moderate' | 'high' = 'moderate';
  if (avgConsistency >= 78) consistencyGrade = 'high';
  else if (avgConsistency < 58) consistencyGrade = 'inconsistent';

  // Precision categorization
  let precisionGrade: 'low' | 'good' | 'elite' = 'good';
  if (avgAccuracy >= 82) precisionGrade = 'elite';
  else if (avgAccuracy < 60) precisionGrade = 'low';

  // Detect specific bullet points from actual performance
  const labels: string[] = [];

  if (flickSpeed === 'slow') labels.push('Flick pausado / lento');
  else if (flickSpeed === 'fast') labels.push('Flick rápido');
  else labels.push('Buena velocidad');

  if (overshootBehavior === 'overshoot') labels.push('Overshoot frecuente');
  else if (overshootBehavior === 'undershoot') labels.push('Undershoot frecuente');
  else labels.push('Control de trayectoria centrado');

  if (consistencyGrade === 'high') labels.push('Alta consistencia');
  else if (consistencyGrade === 'inconsistent') labels.push('Movimiento inconsistente');
  else labels.push('Consistencia media');

  if (precisionGrade === 'elite' || avgAccuracy >= 75) labels.push('Buena precisión');

  // Formulate primary title and actionable advice
  let title = 'Control Táctil Equilibrado';
  let advice = 'Mantén tu configuración actual con micro-ajustes progresivos de ±1.';

  if (overshootBehavior === 'overshoot' && flickSpeed === 'fast') {
    title = 'Flick Rápido con Overshoot Frecuente';
    advice = 'Reducir General ligeramente (-2 a -3) para evitar que la mira pase sobre la cabeza.';
  } else if (overshootBehavior === 'undershoot' || flickSpeed === 'slow') {
    title = 'Flick Pausado / Recorrido Corto';
    advice = 'Aumentar General ligeramente (+2 a +3) para facilitar el levantamiento vertical con menor esfuerzo.';
  } else if (consistencyGrade === 'inconsistent') {
    title = 'Variación en Levantamiento de Mira';
    advice = 'Estabilizar el área de contacto del pulgar y aplicar micro-ajuste de +1.';
  } else if (precisionGrade === 'elite' && consistencyGrade === 'high') {
    title = 'Precisión Competitiva & Alta Consistencia';
    advice = 'Tu memoria muscular está optimizada. Aplica micro-ajustes de ±1 por arma.';
  }

  return {
    flickSpeed,
    overshootBehavior,
    consistencyGrade,
    precisionGrade,
    primaryTrendTitle: title,
    primaryRecommendation: advice,
    detectedLabels: labels,
    avgReactionTimeMs: avgTime,
    avgAccuracyPercent: avgAccuracy,
    avgConsistencyPercent: avgConsistency,
    bestCalibrationScore: bestScore,
  };
}

/**
 * Generate conservative, progressive micro-adjustments strictly in (±1, ±2, ±3, ±5)
 */
export function generateAdaptiveAdjustments(
  currentSensi: CalibrationSensiConfig,
  trend: PlayerTrendAnalysis
): AdaptiveAdjustment[] {
  const adjustments: AdaptiveAdjustment[] = [];

  // General Adjustment
  let genDelta = 0;
  let genReason = 'Ajuste fino de estabilidad.';

  if (trend.overshootBehavior === 'overshoot') {
    genDelta = -2;
    genReason = 'Overshoot frecuente detectado; compensa el deslizamiento excesivo.';
  } else if (trend.flickSpeed === 'slow' || trend.overshootBehavior === 'undershoot') {
    genDelta = +3;
    genReason = 'Flicks pausados o recorridos cortos; facilita el alcance al objetivo.';
  } else if (trend.consistencyGrade === 'high') {
    genDelta = +1;
    genReason = 'Excelente control; micro-ajuste para máxima fluidez.';
  } else {
    genDelta = -1;
    genReason = 'Estabilización de velocidad general.';
  }

  adjustments.push({
    id: 'adj-general',
    parameter: 'general',
    paramLabel: 'GENERAL',
    currentValue: currentSensi.general,
    recommendedValue: clamp200(currentSensi.general + genDelta),
    delta: genDelta,
    reason: genReason,
    status: 'pending',
  });

  // Punto Rojo Adjustment
  let redDotDelta = 0;
  let redDotReason = 'Sincronización con sensibilidad general.';
  if (genDelta < 0) {
    redDotDelta = Math.max(-3, genDelta);
    redDotReason = 'Reduce dispersión en disparos a la cabeza sin mira.';
  } else {
    redDotDelta = Math.min(3, genDelta);
    redDotReason = 'Aumenta respuesta táctil para levantamientos rápidos.';
  }

  adjustments.push({
    id: 'adj-redDot',
    parameter: 'redDot',
    paramLabel: 'PUNTO ROJO',
    currentValue: currentSensi.redDot,
    recommendedValue: clamp200(currentSensi.redDot + redDotDelta),
    delta: redDotDelta,
    reason: redDotReason,
    status: 'pending',
  });

  // Mira 2X
  const scope2xDelta = genDelta > 0 ? +2 : -2;
  adjustments.push({
    id: 'adj-scope2x',
    parameter: 'scope2x',
    paramLabel: 'MIRA 2X',
    currentValue: currentSensi.scope2x,
    recommendedValue: clamp200(currentSensi.scope2x + scope2xDelta),
    delta: scope2xDelta,
    reason: scope2xDelta > 0 ? 'Mejora seguimiento a media distancia (+2).' : 'Evita sobre-apuntar a media distancia (-2).',
    status: 'pending',
  });

  // Mira 4X
  const scope4xDelta = genDelta > 0 ? +1 : -1;
  adjustments.push({
    id: 'adj-scope4x',
    parameter: 'scope4x',
    paramLabel: 'MIRA 4X',
    currentValue: currentSensi.scope4x,
    recommendedValue: clamp200(currentSensi.scope4x + scope4xDelta),
    delta: scope4xDelta,
    reason: 'Control milimétrico de precisión en larga distancia.',
    status: 'pending',
  });

  // Francotirador
  adjustments.push({
    id: 'adj-sniper',
    parameter: 'sniperScope',
    paramLabel: 'FRANCOTIRADOR',
    currentValue: currentSensi.sniperScope,
    recommendedValue: clamp200(currentSensi.sniperScope + (trend.flickSpeed === 'fast' ? -1 : 0)),
    delta: trend.flickSpeed === 'fast' ? -1 : 0,
    reason: 'Estabilidad de retícula para rifles de precisión.',
    status: 'pending',
  });

  // Free Look
  const freeLookDelta = genDelta > 0 ? +2 : -1;
  adjustments.push({
    id: 'adj-freeLook',
    parameter: 'freeLook',
    paramLabel: 'CÁMARA / FREE LOOK',
    currentValue: currentSensi.freeLook,
    recommendedValue: clamp200(currentSensi.freeLook + freeLookDelta),
    delta: freeLookDelta,
    reason: 'Visión periférica equilibrada para rotaciones.',
    status: 'pending',
  });

  return adjustments;
}

/**
 * Format history for evolution graph
 */
export function formatEvolutionData(history: CalibrationRecord[]): EvolutionChartDataPoint[] {
  if (!history || history.length === 0) return [];

  // Sort chronological (oldest to newest)
  const sorted = [...history].reverse();

  return sorted.map((item, idx) => {
    const d = new Date(item.timestamp);
    const dateLabel = isNaN(d.getTime()) ? `S-${idx + 1}` : `${d.getDate()}/${d.getMonth() + 1}`;
    const timeLabel = isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      index: idx + 1,
      testId: item.id,
      timestamp: item.timestamp,
      dateLabel,
      timeLabel,
      reactionTimeMs: item.testMetrics?.avgReactionTimeMs || 150,
      accuracyPercent: item.testMetrics?.avgAccuracy || 70,
      consistencyScore: item.testMetrics?.consistencyScore || 65,
      calibrationScore: item.finalScore || 75,
      weapon: item.playerProfile?.mainWeapon || 'AR',
      hud: `${item.playerProfile?.hudFingers || 2} Dedos`,
      device: item.playerProfile?.deviceModel || 'iPhone',
      generalSensi: item.recommendation?.recommendedSensi?.general || item.initialSensi?.general || 150,
    };
  });
}
