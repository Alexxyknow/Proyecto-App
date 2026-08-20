import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Target,
  Crosshair,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Smartphone,
  ShieldCheck,
  History,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Scale,
  Award,
  UserCheck,
} from 'lucide-react';
import {
  DeviceInfo,
  CalibrationPlayerProfile,
  CalibrationSensiConfig,
  FlickRoundMetric,
  FlickSessionSummary,
  CalibrationRecommendation,
  CalibrationRecord,
  ScreenId,
} from '../types';
import { gamerAudio } from '../utils/audio';

interface SmartCalibratorScreenProps {
  deviceInfo: DeviceInfo;
  onNavigate?: (screen: ScreenId) => void;
}

const DEFAULT_SENSI: Record<string, CalibrationSensiConfig> = {
  escopeta: { general: 194, redDot: 188, scope2x: 178, scope4x: 166, sniperScope: 120, freeLook: 150 },
  smg: { general: 188, redDot: 182, scope2x: 172, scope4x: 158, sniperScope: 122, freeLook: 145 },
  ar: { general: 182, redDot: 170, scope2x: 164, scope4x: 152, sniperScope: 110, freeLook: 140 },
  sniper: { general: 174, redDot: 158, scope2x: 148, scope4x: 136, sniperScope: 92, freeLook: 130 },
  onetap: { general: 196, redDot: 190, scope2x: 180, scope4x: 168, sniperScope: 120, freeLook: 152 },
};

const IPHONE_OPTIONS = [
  'iPhone 16 Pro Max (120Hz)',
  'iPhone 16 Pro (120Hz)',
  'iPhone 16 / 16 Plus (60Hz)',
  'iPhone 15 Pro Max (120Hz)',
  'iPhone 15 Pro (120Hz)',
  'iPhone 15 / 15 Plus (60Hz)',
  'iPhone 14 Pro Max / 14 Pro (120Hz)',
  'iPhone 14 / 13 / 12 Series (60Hz)',
  'iPhone 11 / XR / SE (60Hz)',
  'iPad Pro / Air (Tablet)',
];

export const SmartCalibratorScreen: React.FC<SmartCalibratorScreenProps> = ({ deviceInfo, onNavigate }) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<'profile' | 'test' | 'results' | 'history'>('profile');

  // Step 1: Profile State
  const [profile, setProfile] = useState<CalibrationPlayerProfile>({
    deviceModel: deviceInfo.model || 'iPhone 15 Pro Max',
    hudFingers: '3',
    fireButtonSize: 42,
    screenProtector: 'cristal',
    mainWeapon: 'escopeta',
  });

  // Step 2: Initial Sensitivity (0-200)
  const [currentSensi, setCurrentSensi] = useState<CalibrationSensiConfig>(DEFAULT_SENSI.escopeta);

  // Step 3: Test Engine State
  const [testRound, setTestRound] = useState<number>(0);
  const totalRounds = 4;
  const [roundMetrics, setRoundMetrics] = useState<FlickRoundMetric[]>([]);
  const [isWaitingFlick, setIsWaitingFlick] = useState<boolean>(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [originPos, setOriginPos] = useState<{ x: number; y: number } | null>(null);
  const [touchStartData, setTouchStartData] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastRoundFeedback, setLastRoundFeedback] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Step 4: Results & Recommendations
  const [sessionSummary, setSessionSummary] = useState<FlickSessionSummary | null>(null);
  const [recommendation, setRecommendation] = useState<CalibrationRecommendation | null>(null);
  const [adjustedRec, setAdjustedRec] = useState<CalibrationSensiConfig | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [scoreCategory, setScoreCategory] = useState<'EXCELENTE' | 'BUENO' | 'ESTABLE' | 'NECESITA AJUSTE'>('BUENO');

  // History & Storage
  const [history, setHistory] = useState<CalibrationRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sensi33_calibration_history_v3');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Helper clamp 0-200
  const clamp200 = (v: number) => Math.min(200, Math.max(0, Math.round(v)));

  // Update default sensi when weapon changes in profile
  const handleWeaponChange = (w: 'escopeta' | 'smg' | 'ar' | 'sniper' | 'onetap') => {
    gamerAudio.playSelect();
    setProfile(prev => ({ ...prev, mainWeapon: w }));
    setCurrentSensi(DEFAULT_SENSI[w] || DEFAULT_SENSI.escopeta);
  };

  // Start Calibration Test
  const startFlickTest = () => {
    gamerAudio.playClick();
    setCurrentStep('test');
    setTestRound(1);
    setRoundMetrics([]);
    setLastRoundFeedback(null);
    prepareRound(1);
  };

  // Position target for a round
  const prepareRound = (roundNum: number) => {
    setIsWaitingFlick(false);
    setTargetPos(null);
    setOriginPos(null);
    setTouchStartData(null);

    // Timeout to simulate target popup
    setTimeout(() => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const origin = {
        x: rect.width / 2,
        y: rect.height - 70,
      };
      setOriginPos(origin);

      // Distribute targets in realistic flick arcs (upper quadrant)
      const angles = [-45, 0, 35, -20]; // variations
      const distances = [140, 180, 160, 200];
      const angle = angles[(roundNum - 1) % angles.length] * (Math.PI / 180);
      const dist = distances[(roundNum - 1) % distances.length];

      // Calculate target X, Y relative to origin
      const tx = Math.min(rect.width - 40, Math.max(40, origin.x + Math.sin(angle) * dist));
      const ty = Math.min(rect.height - 100, Math.max(40, origin.y - Math.cos(angle) * dist));

      setTargetPos({ x: tx, y: ty });
      setIsWaitingFlick(true);
      gamerAudio.playClick();
    }, 450);
  };

  // Handle Touch/Mouse Start at Origin
  const handleStartFlick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isWaitingFlick || !originPos || !targetPos) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    setTouchStartData({
      x: relX,
      y: relY,
      time: performance.now(),
    });
  };

  // Handle Touch/Mouse End at Target
  const handleEndFlick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isWaitingFlick || !touchStartData || !targetPos || !originPos) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = clientX - rect.left;
    const endY = clientY - rect.top;
    const endTime = performance.now();

    const elapsedMs = Math.round(endTime - touchStartData.time);

    // Vector from origin to target
    const targetDx = targetPos.x - originPos.x;
    const targetDy = targetPos.y - originPos.y;
    const targetDistance = Math.hypot(targetDx, targetDy);

    // Actual flick vector
    const actualDx = endX - touchStartData.x;
    const actualDy = endY - touchStartData.y;
    const actualDistance = Math.hypot(actualDx, actualDy);

    // Distance from flick end to target center
    const missDistance = Math.hypot(endX - targetPos.x, endY - targetPos.y);

    // Calculate accuracy percentage
    const accuracy = Math.max(10, Math.min(100, Math.round(100 - (missDistance / (targetDistance * 0.7)) * 100)));

    // Calculate overshoot
    const overshoot = Math.round(actualDistance - targetDistance);

    // Swipe angle in degrees
    const swipeAngle = Math.round((Math.atan2(actualDx, -actualDy) * 180) / Math.PI);

    const metric: FlickRoundMetric = {
      roundIndex: testRound,
      reactionTimeMs: elapsedMs,
      distancePx: Math.round(actualDistance),
      targetDistancePx: Math.round(targetDistance),
      swipeAngleDeg: swipeAngle,
      accuracyPercent: accuracy,
      overshootPx: overshoot,
    };

    const newMetrics = [...roundMetrics, metric];
    setRoundMetrics(newMetrics);
    gamerAudio.playSelect();

    // Feedback message
    let feedback = '';
    if (elapsedMs < 110 && accuracy > 75) {
      feedback = '¡Flick Relámpago y Preciso!';
    } else if (overshoot > 35) {
      feedback = 'Sobrepasaste el objetivo (Overshoot)';
    } else if (overshoot < -35) {
      feedback = 'Te quedaste corto en el recorrido';
    } else {
      feedback = 'Buen control de trayectoria';
    }
    setLastRoundFeedback(feedback);

    // Next round or finalize
    if (testRound < totalRounds) {
      const nextR = testRound + 1;
      setTestRound(nextR);
      prepareRound(nextR);
    } else {
      finalizeCalibration(newMetrics);
    }
  };

  // Finalize Calibration Analysis
  const finalizeCalibration = (metrics: FlickRoundMetric[]) => {
    setIsWaitingFlick(false);

    // Compute averages
    const avgTime = Math.round(metrics.reduce((acc, m) => acc + m.reactionTimeMs, 0) / metrics.length);
    const avgAcc = Math.round(metrics.reduce((acc, m) => acc + m.accuracyPercent, 0) / metrics.length);
    const avgOver = Math.round(metrics.reduce((acc, m) => acc + m.overshootPx, 0) / metrics.length);

    // Consistency based on time variance
    const timeVariance =
      metrics.reduce((acc, m) => acc + Math.pow(m.reactionTimeMs - avgTime, 2), 0) / metrics.length;
    const stdDev = Math.sqrt(timeVariance);
    const consistency = Math.max(20, Math.min(100, Math.round(100 - stdDev * 0.8)));

    // Calibration Benchmark Score (0-100)
    const rawScore = Math.round(avgAcc * 0.45 + (100 - Math.min(100, avgTime * 0.3)) * 0.25 + consistency * 0.3);
    const score = Math.max(30, Math.min(99, rawScore));
    setFinalScore(score);

    let category: 'EXCELENTE' | 'BUENO' | 'ESTABLE' | 'NECESITA AJUSTE' = 'BUENO';
    if (score >= 85) category = 'EXCELENTE';
    else if (score >= 70) category = 'BUENO';
    else if (score >= 55) category = 'ESTABLE';
    else category = 'NECESITA AJUSTE';
    setScoreCategory(category);

    // Progressive Adjustment Logic (Offsets between -5 and +5)
    let genOffset = 0;
    let redDotOffset = 0;
    let scope2xOffset = 0;
    let scope4xOffset = 0;
    let sniperOffset = 0;
    let freeLookOffset = 0;
    let trend: 'too_slow' | 'too_fast_overshoot' | 'inconsistent' | 'optimal_control' = 'optimal_control';
    let analysis = '';
    let reason = '';

    if (avgTime > 180 || avgOver < -30) {
      trend = 'too_slow';
      genOffset = +3;
      redDotOffset = +3;
      scope2xOffset = +2;
      scope4xOffset = +2;
      sniperOffset = +1;
      freeLookOffset = +2;
      analysis = 'Movimiento ligeramente pausado o con falta de recorrido vertical.';
      reason =
        'Tus flicks tardaron más de 180ms o quedaron cortos. Un incremento progresivo de +3 facilitará alcanzar la cabeza con menor esfuerzo físico.';
    } else if (avgOver > 30 || (avgTime < 90 && avgAcc < 65)) {
      trend = 'too_fast_overshoot';
      genOffset = -3;
      redDotOffset = -3;
      scope2xOffset = -2;
      scope4xOffset = -2;
      sniperOffset = -1;
      freeLookOffset = -2;
      analysis = 'Exceso de desplazamiento (Overshoot): el dedo sobrepasa el objetivo rápidamente.';
      reason =
        'Tus levantamientos sobrepasaron el objetivo. Reducir ligeramente (-3) evitará que los disparos se vayan por encima de la cabeza.';
    } else if (consistency < 60) {
      trend = 'inconsistent';
      genOffset = +1;
      redDotOffset = +1;
      scope2xOffset = 0;
      scope4xOffset = 0;
      sniperOffset = 0;
      freeLookOffset = 0;
      analysis = 'Variación irregular entre intentos de flick.';
      reason =
        'Se detectó variación en la velocidad entre rondas. Se aconseja un micro-ajuste de +1 y estabilizar el gesto táctil.';
    } else {
      trend = 'optimal_control';
      genOffset = +1;
      redDotOffset = +1;
      scope2xOffset = +1;
      scope4xOffset = 0;
      sniperOffset = 0;
      freeLookOffset = +1;
      analysis = 'Excelente sincronización táctil y control de recorrido.';
      reason =
        'Gran consistencia y precisión en tus flicks. Se propone un micro-ajuste fino de +1 para máxima fluidez.';
    }

    // Apply model & protector fine-tuning
    if (profile.screenProtector === 'mate') {
      genOffset = Math.min(5, genOffset + 1);
    }

    const recConfig: CalibrationSensiConfig = {
      general: clamp200(currentSensi.general + genOffset),
      redDot: clamp200(currentSensi.redDot + redDotOffset),
      scope2x: clamp200(currentSensi.scope2x + scope2xOffset),
      scope4x: clamp200(currentSensi.scope4x + scope4xOffset),
      sniperScope: clamp200(currentSensi.sniperScope + sniperOffset),
      freeLook: clamp200(currentSensi.freeLook + freeLookOffset),
    };

    const summary: FlickSessionSummary = {
      roundsCompleted: metrics.length,
      avgReactionTimeMs: avgTime,
      avgAccuracy: avgAcc,
      avgOvershootPx: avgOver,
      consistencyScore: consistency,
      flickTrend: trend,
      behaviorAnalysis: analysis,
    };

    const recObj: CalibrationRecommendation = {
      generalOffset: genOffset,
      redDotOffset: redDotOffset,
      scope2xOffset: scope2xOffset,
      scope4xOffset: scope4xOffset,
      sniperOffset: sniperOffset,
      freeLookOffset: freeLookOffset,
      recommendedSensi: recConfig,
      reason,
    };

    setSessionSummary(summary);
    setRecommendation(recObj);
    setAdjustedRec({ ...recConfig });
    setCurrentStep('results');
    gamerAudio.playSelect();

    // Auto-save calibration session to history
    const now = new Date();
    const newRecord: CalibrationRecord = {
      id: `calib-${Date.now()}`,
      timestamp: now.toISOString(),
      playerProfile: { ...profile },
      initialSensi: { ...currentSensi },
      testMetrics: summary,
      recommendation: recObj,
      finalScore: score,
      scoreCategory: category,
    };

    const updated = [newRecord, ...history.slice(0, 99)];
    setHistory(updated);
    try {
      localStorage.setItem('sensi33_calibration_history_v3', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  // Quick delta adjustment on recommendation (+5, +1, -1, -5)
  const handleQuickDelta = (delta: number) => {
    if (!adjustedRec) return;
    gamerAudio.playClick();
    setAdjustedRec({
      general: clamp200(adjustedRec.general + delta),
      redDot: clamp200(adjustedRec.redDot + delta),
      scope2x: clamp200(adjustedRec.scope2x + (delta > 0 ? 1 : -1)),
      scope4x: clamp200(adjustedRec.scope4x + (delta > 0 ? 1 : -1)),
      sniperScope: clamp200(adjustedRec.sniperScope),
      freeLook: clamp200(adjustedRec.freeLook + delta),
    });
    triggerToast(`Ajuste fino aplicado: ${delta > 0 ? `+${delta}` : delta} a sensibilidad`);
  };

  // Action: Probar Recomendación (load rec into current & re-test)
  const handleTestRecommendation = () => {
    if (!adjustedRec) return;
    gamerAudio.playClick();
    setCurrentSensi({ ...adjustedRec });
    startFlickTest();
    triggerToast('¡Sensibilidad recomendada cargada! Realiza el test de verificación.');
  };

  // Action: Guardar Perfil & Calibración
  const handleSaveProfile = () => {
    if (!sessionSummary || !recommendation || !adjustedRec) return;
    gamerAudio.playClick();

    const record: CalibrationRecord = {
      id: `calib-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      playerProfile: profile,
      initialSensi: currentSensi,
      testMetrics: sessionSummary,
      recommendation: {
        ...recommendation,
        recommendedSensi: adjustedRec,
      },
      finalScore,
      scoreCategory,
    };

    const updated = [record, ...history.slice(0, 11)];
    setHistory(updated);
    try {
      localStorage.setItem('sensi33_calibration_history_v3', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    triggerToast('¡Calibración guardada exitosamente en el historial!');
  };

  // Action: Copiar Comparación
  const handleCopyComparison = () => {
    if (!adjustedRec) return;
    const text = `🔥 SENSI 33 - CALIBRADOR INTELIGENTE (ESCALA 0–200)\n📱 Dispositivo: ${profile.deviceModel} • HUD: ${profile.hudFingers} Dedos\n🔫 Arma Principal: ${profile.mainWeapon.toUpperCase()}\n🛡️ Mica: ${profile.screenProtector} • Botón: ${profile.fireButtonSize}%\n🎯 Puntuación de Calibración: ${finalScore}/100 (${scoreCategory})\n\n⚖️ COMPARATIVA DE SENSIBILIDADES:\n- General: ${currentSensi.general} → ${adjustedRec.general} / 200\n- Punto Rojo: ${currentSensi.redDot} → ${adjustedRec.redDot} / 200\n- Mira 2X: ${currentSensi.scope2x} → ${adjustedRec.scope2x} / 200\n- Mira 4X: ${currentSensi.scope4x} → ${adjustedRec.scope4x} / 200\n- Francotirador: ${currentSensi.sniperScope} → ${adjustedRec.sniperScope} / 200\n- Cámara / Free Look: ${currentSensi.freeLook} → ${adjustedRec.freeLook} / 200\n\n💡 Diagnóstico: ${sessionSummary?.behaviorAnalysis}\n${recommendation?.reason}`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    triggerToast('¡Comparativa copiada al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear History
  const handleClearHistory = () => {
    gamerAudio.playClick();
    setHistory([]);
    try {
      localStorage.removeItem('sensi33_calibration_history_v3');
    } catch {
      // Ignore storage errors
    }
    triggerToast('Historial de calibraciones eliminado.');
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(255,30,39,0.8)] border border-red-400 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              V3 SMART CALIBRATOR
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ESCALA 0–200
            </span>
            <span className="text-xs font-mono text-zinc-400">CALIBRACIÓN PROGRESIVA & REFLEJOS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            CALIBRADOR INTELIGENTE SENSI 33
          </h2>
        </div>

        {/* Step Navigation Pill Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              gamerAudio.playSelect();
              setCurrentStep('profile');
            }}
            className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
              currentStep === 'profile' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            1. PERFIL
          </button>
          <button
            onClick={() => {
              gamerAudio.playSelect();
              startFlickTest();
            }}
            className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
              currentStep === 'test' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            2. TEST FLICK
          </button>
          <button
            onClick={() => {
              if (!sessionSummary) {
                triggerToast('Realiza primero el test de flick para ver resultados.');
                return;
              }
              gamerAudio.playSelect();
              setCurrentStep('results');
            }}
            className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
              currentStep === 'results' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            3. RECOMENDACIÓN
          </button>
          <button
            onClick={() => {
              gamerAudio.playSelect();
              setCurrentStep('history');
            }}
            className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold flex items-center gap-1 ${
              currentStep === 'history' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>HISTORIAL ({history.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PERFIL DEL JUGADOR & SENSI INICIAL */}
      {currentStep === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-2.5 flex-1">
          {/* Left Column: Player Hardware & Grip Profile (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-xs font-mono text-white font-bold">
              <Smartphone className="w-4 h-4 text-red-500" />
              <span>1. PERFIL DEL JUGADOR & HARDWARE</span>
            </div>

            {/* Device selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-400 font-bold">MODELO DE DISPOSITIVO</label>
              <select
                value={profile.deviceModel}
                onChange={e => setProfile(prev => ({ ...prev, deviceModel: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-700 text-xs font-mono rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {IPHONE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* HUD Fingers & Protector in 2 cols */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 font-bold">HUD (DEDOS)</label>
                <div className="flex gap-1">
                  {(['2', '3', '4'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        gamerAudio.playSelect();
                        setProfile(prev => ({ ...prev, hudFingers: f }));
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        profile.hudFingers === f
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {f}D
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 font-bold">TIPO DE MICA</label>
                <select
                  value={profile.screenProtector}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev,
                      screenProtector: e.target.value as 'ninguno' | 'cristal' | 'mate',
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 text-xs font-mono rounded-lg px-2 py-1 text-white focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="cristal">Cristal 9D</option>
                  <option value="mate">Mica Mate</option>
                  <option value="ninguno">Sin Mica</option>
                </select>
              </div>
            </div>

            {/* Weapon Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-400 font-bold">ARMA PRINCIPAL DE JUEGO</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'escopeta', label: '💥 Escopeta' },
                  { id: 'smg', label: '⚡️ SMG' },
                  { id: 'ar', label: '🎯 AR Asalto' },
                  { id: 'sniper', label: '🔭 Sniper' },
                  { id: 'onetap', label: '🔥 One-Tap' },
                ].map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleWeaponChange(w.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold text-center transition cursor-pointer ${
                      profile.mainWeapon === w.id
                        ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fire Button Size */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400 font-bold">BOTÓN DE DISPARO ACTUAL:</span>
                <span className="text-red-400 font-bold">{profile.fireButtonSize}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="75"
                value={profile.fireButtonSize}
                onChange={e => setProfile(prev => ({ ...prev, fireButtonSize: +e.target.value }))}
                className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Initial Sensitivity (0-200) (7 cols) */}
          <div className="lg:col-span-7 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sliders className="w-4 h-4 text-red-500" />
                <span>2. CONFIGURACIÓN INICIAL (ESCALA 0–200)</span>
              </div>
              <span className="text-emerald-400 font-bold text-[11px]">AJUSTE ACTUAL DEL USUARIO</span>
            </div>

            {/* Sliders Grid 0-200 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* General */}
              <div className="space-y-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">GENERAL</span>
                  <span className="text-red-400 font-black">{currentSensi.general} / 200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, general: clamp200(p.general - 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentSensi.general}
                    onChange={e => setCurrentSensi(p => ({ ...p, general: clamp200(+e.target.value) }))}
                    className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, general: clamp200(p.general + 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Punto Rojo */}
              <div className="space-y-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">PUNTO ROJO</span>
                  <span className="text-red-400 font-black">{currentSensi.redDot} / 200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, redDot: clamp200(p.redDot - 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentSensi.redDot}
                    onChange={e => setCurrentSensi(p => ({ ...p, redDot: clamp200(+e.target.value) }))}
                    className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, redDot: clamp200(p.redDot + 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Mira 2X */}
              <div className="space-y-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">MIRA 2X</span>
                  <span className="text-red-400 font-black">{currentSensi.scope2x} / 200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, scope2x: clamp200(p.scope2x - 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentSensi.scope2x}
                    onChange={e => setCurrentSensi(p => ({ ...p, scope2x: clamp200(+e.target.value) }))}
                    className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, scope2x: clamp200(p.scope2x + 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Mira 4X */}
              <div className="space-y-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">MIRA 4X</span>
                  <span className="text-red-400 font-black">{currentSensi.scope4x} / 200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, scope4x: clamp200(p.scope4x - 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentSensi.scope4x}
                    onChange={e => setCurrentSensi(p => ({ ...p, scope4x: clamp200(+e.target.value) }))}
                    className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, scope4x: clamp200(p.scope4x + 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Francotirador */}
              <div className="space-y-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">FRANCOTIRADOR</span>
                  <span className="text-red-400 font-black">{currentSensi.sniperScope} / 200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, sniperScope: clamp200(p.sniperScope - 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentSensi.sniperScope}
                    onChange={e => setCurrentSensi(p => ({ ...p, sniperScope: clamp200(+e.target.value) }))}
                    className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, sniperScope: clamp200(p.sniperScope + 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cámara / Free Look */}
              <div className="space-y-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">CÁMARA / FREE LOOK</span>
                  <span className="text-red-400 font-black">{currentSensi.freeLook} / 200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, freeLook: clamp200(p.freeLook - 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentSensi.freeLook}
                    onChange={e => setCurrentSensi(p => ({ ...p, freeLook: clamp200(+e.target.value) }))}
                    className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => setCurrentSensi(p => ({ ...p, freeLook: clamp200(p.freeLook + 1) }))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              id="btn-start-calibration-test"
              onClick={startFlickTest}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,30,39,0.5)] transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
              <span>INICIAR TEST DE FLICKS & REFLEJOS →</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: TEST DE FLICK INTERACTIVO */}
      {currentStep === 'test' && (
        <div className="flex-1 flex flex-col justify-between my-2">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-bold">
                RONDA {testRound} DE {totalRounds}
              </span>
              <span className="text-zinc-400">
                {lastRoundFeedback ? (
                  <span className="text-yellow-400 font-bold">{lastRoundFeedback}</span>
                ) : (
                  'Desliza tu dedo desde el botón inferior hacia el objetivo rojo'
                )}
              </span>
            </div>
            <button
              onClick={() => {
                gamerAudio.playClick();
                setCurrentStep('profile');
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 text-[11px] cursor-pointer"
            >
              ✕ CANCELAR
            </button>
          </div>

          {/* Flick Canvas Area */}
          <div
            ref={canvasRef}
            className="relative flex-1 my-2 rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-800 overflow-hidden flex items-center justify-center touch-none select-none"
          >
            {/* Grid Lines Ambient */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2026_1px,transparent_1px),linear-gradient(to_bottom,#1f2026_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

            {/* Target Circle */}
            {isWaitingFlick && targetPos && (
              <div
                className="absolute w-14 h-14 rounded-full border-2 border-red-500 bg-red-600/30 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse shadow-[0_0_25px_rgba(255,30,39,0.8)] z-20"
                style={{ left: `${targetPos.x}px`, top: `${targetPos.y}px` }}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow" />
                <div className="absolute -top-5 text-[9px] font-mono text-red-400 font-bold whitespace-nowrap">
                  OBJETIVO
                </div>
              </div>
            )}

            {/* Interactive Origin/Trigger Button (Bottom) */}
            {originPos && (
              <div
                onMouseDown={handleStartFlick}
                onTouchStart={handleStartFlick}
                onMouseUp={handleEndFlick}
                onTouchEnd={handleEndFlick}
                className="absolute w-20 h-20 rounded-full border-2 border-white bg-red-600/40 hover:bg-red-600/60 active:bg-red-600 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all z-30 group"
                style={{ left: `${originPos.x}px`, top: `${originPos.y}px` }}
              >
                <Crosshair className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-mono text-white font-bold mt-0.5 tracking-tighter text-center leading-tight">
                  TOCA & FLICK
                </span>
              </div>
            )}

            {/* Connecting trajectory guide hint */}
            {originPos && targetPos && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1={originPos.x}
                  y1={originPos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="rgba(255,30,39,0.25)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            )}

            {/* Instruction overlay when starting */}
            {!isWaitingFlick && (
              <div className="text-center font-mono space-y-1 pointer-events-none z-40">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto mb-2" />
                <span className="text-xs text-zinc-300 font-bold">GENERANDO TRAYECTORIA...</span>
              </div>
            )}
          </div>

          {/* Bottom Telemetry Strip */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">RONDAS</span>
              <span className="font-bold text-white">
                {roundMetrics.length} / {totalRounds}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">ÚLTIMO TIEMPO</span>
              <span className="font-bold text-yellow-400">
                {roundMetrics[roundMetrics.length - 1]?.reactionTimeMs || 0} ms
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">PRECISIÓN</span>
              <span className="font-bold text-emerald-400">
                {roundMetrics[roundMetrics.length - 1]?.accuracyPercent || 0}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">DESVÍO</span>
              <span className="font-bold text-red-400">
                {roundMetrics[roundMetrics.length - 1]?.overshootPx || 0} px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ANÁLISIS & RECOMENDACIÓN SENSI 33 (LADO A LADO) */}
      {currentStep === 'results' && sessionSummary && recommendation && adjustedRec && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-2 flex-1 overflow-y-auto pr-1">
          {/* Left Column: Calibration Score & Diagnostic Analysis (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              {/* Score Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-400" />
                  PUNTUACIÓN DE CALIBRACIÓN
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    scoreCategory === 'EXCELENTE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : scoreCategory === 'BUENO'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : scoreCategory === 'ESTABLE'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {scoreCategory}
                </span>
              </div>

              {/* Big Score Display */}
              <div className="my-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center flex items-center justify-around">
                <div>
                  <div className="text-3xl font-black italic text-white tracking-tighter">
                    {finalScore}
                    <span className="text-xs text-zinc-500 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">SCORE BENCHMARK</span>
                </div>
                <div className="h-8 w-px bg-zinc-800" />
                <div>
                  <div className="text-lg font-bold text-yellow-400 font-mono">
                    {sessionSummary.avgReactionTimeMs} ms
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">VELOCIDAD PROMEDIO</span>
                </div>
                <div className="h-8 w-px bg-zinc-800" />
                <div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {sessionSummary.consistencyScore}%
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">CONSISTENCIA</span>
                </div>
              </div>

              {/* Diagnostic Box */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  DIAGNÓSTICO TÁCTIL:
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  {sessionSummary.behaviorAnalysis}
                </p>
                <p className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/80">
                  {recommendation.reason}
                </p>
              </div>
            </div>

            {/* Quick Fine-Tuning Delta Buttons */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-2">
              <span className="text-zinc-300 font-bold block text-[11px]">
                AJUSTE FINO MANUAL SOBRE LA RECOMENDACIÓN:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleQuickDelta(-5)}
                  className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700 cursor-pointer"
                >
                  -5
                </button>
                <button
                  onClick={() => handleQuickDelta(-1)}
                  className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700 cursor-pointer"
                >
                  -1
                </button>
                <button
                  onClick={() => handleQuickDelta(+1)}
                  className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700 cursor-pointer"
                >
                  +1
                </button>
                <button
                  onClick={() => handleQuickDelta(+5)}
                  className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700 cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Side-by-Side Comparison & Action Buttons (7 cols) */}
          <div className="lg:col-span-7 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-red-500" />
                  RECOMENDACIÓN SENSI 33 (ESCALA 0–200)
                </span>
                <span className="text-zinc-400">ANTERIOR vs. RECOMENDADA</span>
              </div>

              {/* Comparison Table */}
              <div className="space-y-1.5 my-2.5">
                {[
                  {
                    name: 'GENERAL',
                    prev: currentSensi.general,
                    next: adjustedRec.general,
                  },
                  {
                    name: 'PUNTO ROJO',
                    prev: currentSensi.redDot,
                    next: adjustedRec.redDot,
                  },
                  {
                    name: 'MIRA 2X',
                    prev: currentSensi.scope2x,
                    next: adjustedRec.scope2x,
                  },
                  {
                    name: 'MIRA 4X',
                    prev: currentSensi.scope4x,
                    next: adjustedRec.scope4x,
                  },
                  {
                    name: 'FRANCOTIRADOR',
                    prev: currentSensi.sniperScope,
                    next: adjustedRec.sniperScope,
                  },
                  {
                    name: 'CÁMARA / FREE LOOK',
                    prev: currentSensi.freeLook,
                    next: adjustedRec.freeLook,
                  },
                ].map(item => {
                  const delta = item.next - item.prev;
                  return (
                    <div
                      key={item.name}
                      className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-zinc-300 font-bold">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">{item.prev}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                        <span className="text-red-400 font-black text-sm">{item.next} / 200</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            delta > 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : delta < 0
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta === 0 ? '=' : delta}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800">
              <button
                id="btn-test-recommendation"
                onClick={handleTestRecommendation}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,30,39,0.4)] cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>PROBAR</span>
              </button>

              <button
                id="btn-save-calib-profile"
                onClick={handleSaveProfile}
                className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-mono text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GUARDAR</span>
              </button>

              <button
                id="btn-copy-calib-comparison"
                onClick={handleCopyComparison}
                className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-mono text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>COPIAR</span>
              </button>

              {onNavigate && (
                <>
                  <button
                    id="btn-goto-adaptive-profile"
                    onClick={() => {
                      gamerAudio.playSelect();
                      onNavigate('adaptive');
                    }}
                    className="py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 font-mono text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>PERFIL →</span>
                  </button>

                  <button
                    id="btn-goto-evolution-mode"
                    onClick={() => {
                      gamerAudio.playSelect();
                      onNavigate('evolution');
                    }}
                    className="col-span-2 sm:col-span-1 py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-mono text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>EVOLUCIÓN →</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: HISTORIAL DE CALIBRACIONES */}
      {currentStep === 'history' && (
        <div className="flex-1 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 my-2 flex flex-col justify-between space-y-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-red-500" />
              <span className="text-white font-bold">HISTORIAL DE SESIONES DE CALIBRACIÓN</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>ELIMINAR HISTORIAL</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-zinc-500 space-y-2">
              <History className="w-8 h-8 text-zinc-700 mx-auto" />
              <p>Aún no has registrado calibraciones.</p>
              <button
                onClick={() => {
                  gamerAudio.playClick();
                  setCurrentStep('profile');
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                INICIAR PRIMERA CALIBRACIÓN →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.playerProfile.deviceModel}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold uppercase">
                        {item.playerProfile.mainWeapon}
                      </span>
                      <span className="text-[10px] text-zinc-500">{item.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Gen: <strong className="text-white">{item.initialSensi.general}</strong> →{' '}
                      <strong className="text-red-400">{item.recommendation.recommendedSensi.general}</strong> • Punto: <strong className="text-white">{item.initialSensi.redDot}</strong> → <strong className="text-red-400">{item.recommendation.recommendedSensi.redDot}</strong> • 2X: <strong className="text-red-400">{item.recommendation.recommendedSensi.scope2x}</strong>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {item.testMetrics.behaviorAnalysis}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-sm font-black text-white">{item.finalScore}/100</div>
                      <span className="text-[9px] text-yellow-400 font-bold">{item.scoreCategory}</span>
                    </div>
                    <button
                      onClick={() => {
                        gamerAudio.playSelect();
                        setCurrentSensi(item.recommendation.recommendedSensi);
                        startFlickTest();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-zinc-700 font-bold text-[11px] cursor-pointer"
                    >
                      RE-TEST →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Las calibraciones se guardan localmente en tu dispositivo.</span>
            <span>SENSI 33 V3 ENGINE</span>
          </div>
        </div>
      )}

      {/* Footer Ethics & Fair Play Disclaimer */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>100% Fair Play:</strong> El Calibrador Inteligente analiza únicamente tus reflejos dentro de SENSI 33. No modifica archivos, ejecutables ni memoria de Free Fire.
          </span>
        </div>
      </div>
    </div>
  );
};
