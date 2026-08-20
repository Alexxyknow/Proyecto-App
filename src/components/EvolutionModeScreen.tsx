import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  Target,
  BarChart3,
  Calendar,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  Scale,
  Smartphone,
  Layers,
  ChevronRight,
  Crosshair,
  RotateCcw,
  Check,
  X,
  Info,
  Edit3,
  ShieldCheck,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  DeviceInfo,
  CalibrationRecord,
  EvolutionChartDataPoint,
  EvolutionTrendResult,
  EvolutionSummaryStats,
  EvolutionGoals,
  EvolutionStreak,
  EvolutionComparisonMetric,
  ScreenId,
} from '../types';
import { gamerAudio } from '../utils/audio';
import {
  DEFAULT_EVOLUTION_GOALS,
  computeEvolutionSummary,
  computeEvolutionTrend,
  computeEvolutionStreak,
  computeEvolutionComparison,
  generateEvolutionRecommendations,
  formatEvolutionChartData,
} from '../utils/evolutionEngine';

interface EvolutionModeScreenProps {
  deviceInfo: DeviceInfo;
  onNavigate: (screen: ScreenId) => void;
}

export const EvolutionModeScreen: React.FC<EvolutionModeScreenProps> = ({
  deviceInfo,
  onNavigate,
}) => {
  // Navigation sub-tabs inside Evolution Mode
  const [activeSubTab, setActiveSubTab] = useState<'grafica' | 'resumen' | 'comparacion' | 'objetivos' | 'historial'>('grafica');

  // Stored Calibration Records
  const [history, setHistory] = useState<CalibrationRecord[]>([]);

  // Chart configuration
  const [chartMetric, setChartMetric] = useState<'all' | 'score' | 'time' | 'acc' | 'cons'>('score');
  const [sessionLimit, setSessionLimit] = useState<10 | 20 | 30>(10);
  const [hoveredPoint, setHoveredPoint] = useState<EvolutionChartDataPoint | null>(null);

  // User Goals State
  const [goals, setGoals] = useState<EvolutionGoals>(DEFAULT_EVOLUTION_GOALS);
  const [isEditingGoals, setIsEditingGoals] = useState<boolean>(false);
  const [tempGoals, setTempGoals] = useState<EvolutionGoals>(DEFAULT_EVOLUTION_GOALS);

  // Confirm delete modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history & goals from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('sensi33_calibration_history_v3');
      if (storedHistory) {
        const parsed: CalibrationRecord[] = JSON.parse(storedHistory);
        setHistory(parsed);
      }

      const storedGoals = localStorage.getItem('sensi33_evolution_goals_v3');
      if (storedGoals) {
        const parsedGoals: EvolutionGoals = JSON.parse(storedGoals);
        setGoals(parsedGoals);
        setTempGoals(parsedGoals);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Compute reactive stats
  const summaryStats: EvolutionSummaryStats = computeEvolutionSummary(history);
  const trendResult: EvolutionTrendResult = computeEvolutionTrend(history);
  const streakResult: EvolutionStreak = computeEvolutionStreak(history);
  const comparisonMetrics: EvolutionComparisonMetric[] = computeEvolutionComparison(history);
  const recommendations: string[] = generateEvolutionRecommendations(history, trendResult, streakResult, summaryStats);
  const chartData: EvolutionChartDataPoint[] = formatEvolutionChartData(history, sessionLimit);

  // Action: Save Goals
  const handleSaveGoals = () => {
    gamerAudio.playSelect();
    setGoals(tempGoals);
    setIsEditingGoals(false);
    try {
      localStorage.setItem('sensi33_evolution_goals_v3', JSON.stringify(tempGoals));
    } catch {
      // Ignore storage errors
    }
    triggerToast('¡Objetivos de entrenamiento actualizados!');
  };

  // Action: Delete Single Session
  const handleDeleteSession = (id: string) => {
    gamerAudio.playClick();
    const updated = history.filter(r => r.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('sensi33_calibration_history_v3', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    setDeleteTargetId(null);
    triggerToast('Sesión eliminada del historial.');
  };

  // Action: Clear All Session History (keeps sensitivity and weapon profiles)
  const handleClearAllHistory = () => {
    gamerAudio.playClick();
    setHistory([]);
    try {
      localStorage.removeItem('sensi33_calibration_history_v3');
    } catch {
      // Ignore storage errors
    }
    setShowClearAllModal(false);
    triggerToast('Historial de sesiones borrado. Perfiles de sensibilidad conservados.');
  };

  // Helper for goal completion calculation
  const getGoalProgress = (current: number, target: number, isLowerBetter: boolean = false) => {
    if (target <= 0 || current <= 0) return 0;
    if (isLowerBetter) {
      // Lower ms is better (e.g. current 120ms, target 110ms)
      if (current <= target) return 100;
      const pct = (target / current) * 100;
      return Math.min(100, Math.max(0, Math.round(pct)));
    }
    const pct = (current / target) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
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

      {/* Confirmation Modal: Delete Single Session */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-[0_0_30px_rgba(255,30,39,0.3)]">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-white text-sm font-mono">¿ELIMINAR ESTA SESIÓN?</h3>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              Se eliminará este registro de calibración del cálculo de tendencias y gráficas evolutivas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={() => handleDeleteSession(deleteTargetId)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow cursor-pointer"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All History */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-[0_0_30px_rgba(255,30,39,0.3)]">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-white text-base font-mono">¿BORRAR TODO EL HISTORIAL?</h3>
            </div>
            <p className="text-xs font-mono text-zinc-300 leading-relaxed">
              Se eliminarán todas las sesiones registradas. <strong className="text-emerald-400">Tus perfiles de sensibilidad por arma y por dispositivo se mantendrán intactos.</strong>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={handleClearAllHistory}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(255,30,39,0.5)] cursor-pointer"
              >
                SÍ, BORRAR HISTORIAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              MODO EVOLUCIÓN SENSI 33
            </span>
            {/* Racha Actual Badge (Section 6) */}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{streakResult.currentStreak > 0 ? `RACHA: 🔥 ${streakResult.currentStreak} SESIONES` : 'SIN RACHA ACTIVA'}</span>
            </span>
            {/* Tendencia Status Badge (Section 3) */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                trendResult.status === 'MEJORANDO'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : trendResult.status === 'ESTABLE'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : trendResult.status === 'EMPEORANDO'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              TENDENCIA: {trendResult.status}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            SEGUIMIENTO & PROGRESO DEL JUGADOR
          </h2>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 flex-wrap">
          {[
            { id: 'grafica', label: '1. GRÁFICA' },
            { id: 'resumen', label: '2. TU EVOLUCIÓN' },
            { id: 'comparacion', label: '3. COMPARACIÓN' },
            { id: 'objetivos', label: '4. OBJETIVOS' },
            { id: 'historial', label: '5. HISTORIAL' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                gamerAudio.playSelect();
                setActiveSubTab(tab.id as any);
              }}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                activeSubTab === tab.id
                  ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: GRÁFICA DE EVOLUCIÓN (Section 2) */}
      {activeSubTab === 'grafica' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-2.5 flex-1">
          {/* Main Chart Area (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-500" />
                <span className="text-white font-bold">
                  GRÁFICA DE RENDIMIENTO EN TIEMPO REAL
                </span>
              </div>

              {/* Range Filters: 10, 20, 30 sessions (Section 2) */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-500 px-1 font-bold">VER:</span>
                {[10, 20, 30].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      gamerAudio.playClick();
                      setSessionLimit(n as any);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      sessionLimit === n ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ÚLTIMAS {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Buttons (Section 2) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'score', label: 'SCORE (PTS)', color: 'border-red-500 text-red-400' },
                { id: 'time', label: 'TIEMPO REACCIÓN (MS)', color: 'border-yellow-500 text-yellow-400' },
                { id: 'acc', label: 'PRECISIÓN (%)', color: 'border-emerald-500 text-emerald-400' },
                { id: 'cons', label: 'CONSISTENCIA (%)', color: 'border-cyan-500 text-cyan-400' },
                { id: 'all', label: 'TODAS LAS MÉTRICAS', color: 'border-white text-white' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    gamerAudio.playSelect();
                    setChartMetric(m.id as any);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                    chartMetric === m.id
                      ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(255,30,39,0.3)]'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Interactive Chart Visualizer */}
            <div className="flex-1 min-h-[220px] rounded-2xl bg-zinc-950 border border-zinc-800 p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2026_1px,transparent_1px),linear-gradient(to_bottom,#1f2026_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 pointer-events-none" />

              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center font-mono space-y-2 z-10 my-auto">
                  <Target className="w-10 h-10 text-zinc-600 animate-pulse" />
                  <span className="text-zinc-300 font-bold text-xs">NO HAY SESIONES REGISTRADAS</span>
                  <p className="text-[11px] text-zinc-500 max-w-sm">
                    Completa sesiones de prueba en el Calibrador Inteligente para visualizar tu curva evolutiva en esta gráfica.
                  </p>
                  <button
                    onClick={() => {
                      gamerAudio.playSelect();
                      onNavigate('calibrator');
                    }}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow"
                  >
                    INICIAR CALIBRACIÓN →
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between z-10">
                  {/* Tooltip Overlay */}
                  {hoveredPoint && (
                    <div className="absolute top-2 right-2 bg-zinc-900/95 border border-red-500/60 p-2.5 rounded-xl text-[10px] font-mono shadow-[0_0_15px_rgba(255,30,39,0.3)] z-20 space-y-0.5 pointer-events-none">
                      <span className="text-red-400 font-bold block">
                        SESIÓN #{hoveredPoint.index} • {hoveredPoint.dateLabel} {hoveredPoint.timeLabel}
                      </span>
                      <div className="grid grid-cols-2 gap-x-3 text-zinc-300">
                        <span>Score: <strong className="text-white">{hoveredPoint.calibrationScore} pts</strong></span>
                        <span>Reacción: <strong className="text-yellow-400">{hoveredPoint.reactionTimeMs} ms</strong></span>
                        <span>Precisión: <strong className="text-emerald-400">{hoveredPoint.accuracyPercent}%</strong></span>
                        <span>Consistencia: <strong className="text-cyan-400">{hoveredPoint.consistencyScore}%</strong></span>
                        <span>Arma: <strong className="text-white uppercase">{hoveredPoint.weapon}</strong></span>
                        <span>Sensi General: <strong className="text-white">{hoveredPoint.generalSensi}/200</strong></span>
                      </div>
                    </div>
                  )}

                  {/* SVG Chart */}
                  <div className="w-full flex-1 relative flex items-end">
                    <svg className="w-full h-44 overflow-visible">
                      {/* Reference Gridlines */}
                      <line x1="0" y1="20" x2="100%" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="100%" y2="75" stroke="#27272a" strokeDasharray="3 3" />
                      <line x1="0" y1="130" x2="100%" y2="130" stroke="#27272a" strokeDasharray="3 3" />

                      {/* Polyline: Score (Red) */}
                      {(chartMetric === 'all' || chartMetric === 'score') && (
                        <polyline
                          fill="none"
                          stroke="#ff1e27"
                          strokeWidth="3"
                          points={chartData
                            .map((d, i) => {
                              const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 90 + 5;
                              const y = 145 - (d.calibrationScore / 100) * 125;
                              return `${x}%,${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Polyline: Reaction Time (Yellow, lower is higher on graph) */}
                      {(chartMetric === 'all' || chartMetric === 'time') && (
                        <polyline
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="2"
                          points={chartData
                            .map((d, i) => {
                              const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 90 + 5;
                              const norm = Math.max(0, Math.min(1, (240 - d.reactionTimeMs) / 160));
                              const y = 145 - norm * 125;
                              return `${x}%,${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Polyline: Accuracy (Emerald) */}
                      {(chartMetric === 'all' || chartMetric === 'acc') && (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray={chartMetric === 'all' ? '4 2' : 'none'}
                          points={chartData
                            .map((d, i) => {
                              const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 90 + 5;
                              const y = 145 - (d.accuracyPercent / 100) * 125;
                              return `${x}%,${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Polyline: Consistency (Cyan) */}
                      {(chartMetric === 'all' || chartMetric === 'cons') && (
                        <polyline
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2"
                          strokeDasharray="2 2"
                          points={chartData
                            .map((d, i) => {
                              const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 90 + 5;
                              const y = 145 - (d.consistencyScore / 100) * 125;
                              return `${x}%,${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Data Point Circles */}
                      {chartData.map((d, i) => {
                        const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 90 + 5;
                        const yScore = 145 - (d.calibrationScore / 100) * 125;
                        return (
                          <g key={d.testId}>
                            <circle
                              cx={`${x}%`}
                              cy={yScore}
                              r={hoveredPoint?.testId === d.testId ? '7' : '4.5'}
                              fill={hoveredPoint?.testId === d.testId ? '#ff1e27' : '#ffffff'}
                              stroke="#ff1e27"
                              strokeWidth="2"
                              onMouseEnter={() => setHoveredPoint(d)}
                              onMouseLeave={() => setHoveredPoint(null)}
                              className="cursor-pointer transition-all"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* X-Axis Session Identifiers */}
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                    {chartData.map((d, i) => (
                      <span key={d.testId} className="truncate max-w-[65px] text-center">
                        #{d.index}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Calibration Action */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-zinc-400">
                {history.length} sesión(es) registradas en total.
              </span>
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  onNavigate('calibrator');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>NUEVA CALIBRACIÓN</span>
              </button>
            </div>
          </div>

          {/* Right Column: Racha, Tendencia & Recomendaciones (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
            {/* Racha Actual Card (Section 6) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  RACHA ACTUAL
                </span>
                <span className="text-zinc-400 text-[10px]">RECORD: {streakResult.bestStreak}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
                <span className="text-2xl font-black text-amber-400 italic block">
                  {streakResult.currentStreak > 0 ? `🔥 ${streakResult.currentStreak} SESIONES` : 'SIN RACHA'}
                </span>
                <p className="text-[10px] font-mono text-zinc-400">
                  {streakResult.streakStatusText}
                </p>
              </div>
            </div>

            {/* Tendencia Card (Section 3) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  TENDENCIA ESTADÍSTICA
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    trendResult.status === 'MEJORANDO'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : trendResult.status === 'ESTABLE'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : trendResult.status === 'EMPEORANDO'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {trendResult.status}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
                <p className="text-[11px] leading-relaxed">{trendResult.description}</p>
              </div>
            </div>

            {/* Recomendaciones Reales (Section 8) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-zinc-800">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  RECOMENDACIONES
                </span>
                <span className="text-[10px] text-zinc-400">DATOS REALES</span>
              </div>

              <div className="space-y-1.5 my-1">
                {recommendations.slice(0, 3).map((rec, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-300 leading-relaxed flex items-start gap-1.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              <div className="p-2 rounded-xl bg-zinc-950 text-[9px] font-mono text-zinc-500 flex items-center gap-1 border border-zinc-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>100% Fair Play. Análisis local en sandbox sin modificar Free Fire.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RESUMEN ("TU EVOLUCIÓN") (Section 4) */}
      {activeSubTab === 'resumen' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
            <span className="text-white font-black text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-red-500" />
              TARJETA DE RESUMEN: TU EVOLUCIÓN
            </span>
            <span className="text-emerald-400 font-bold text-[11px]">
              {summaryStats.totalSessions} SESIONES COMPLETADAS
            </span>
          </div>

          {/* 6 Metric Cards Grid (Section 4) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 flex-1">
            {/* 1. Mejor Score */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">MEJOR SCORE</span>
              <div className="my-auto py-2">
                <span className="text-2xl font-black italic text-emerald-400">
                  {summaryStats.bestScore > 0 ? `${summaryStats.bestScore} pts` : '--'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Benchmark Máximo</span>
            </div>

            {/* 2. Score Promedio */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">SCORE PROMEDIO</span>
              <div className="my-auto py-2">
                <span className="text-2xl font-black italic text-white">
                  {summaryStats.avgScore > 0 ? `${summaryStats.avgScore} pts` : '--'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Global Histórico</span>
            </div>

            {/* 3. Mejor Tiempo de Reacción */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">MEJOR REACCIÓN</span>
              <div className="my-auto py-2">
                <span className="text-2xl font-black italic text-yellow-400">
                  {summaryStats.bestReactionTimeMs > 0 ? `${summaryStats.bestReactionTimeMs} ms` : '--'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Flick Más Rápido</span>
            </div>

            {/* 4. Precisión Promedio */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">PRECISIÓN PROMEDIO</span>
              <div className="my-auto py-2">
                <span className="text-2xl font-black italic text-emerald-400">
                  {summaryStats.avgAccuracyPercent > 0 ? `${summaryStats.avgAccuracyPercent}%` : '--'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Impacto en Cabeza</span>
            </div>

            {/* 5. Consistencia Promedio */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">CONSISTENCIA PROMEDIO</span>
              <div className="my-auto py-2">
                <span className="text-2xl font-black italic text-cyan-400">
                  {summaryStats.avgConsistencyPercent > 0 ? `${summaryStats.avgConsistencyPercent}%` : '--'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Estabilidad Eje Y</span>
            </div>

            {/* 6. Sesiones Completadas */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-center">
              <span className="text-[10px] font-mono text-zinc-400 block">SESIONES TOTALES</span>
              <div className="my-auto py-2">
                <span className="text-2xl font-black italic text-red-500">
                  {summaryStats.totalSessions}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">Muestras Guardadas</span>
            </div>
          </div>

          {/* Deep Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-red-500" />
                ESTADO DE MEMORIA MUSCULAR
              </span>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                {summaryStats.totalSessions >= 3
                  ? `Tu nivel de consistencia (${summaryStats.avgConsistencyPercent}%) indica un patrón ${
                      summaryStats.avgConsistencyPercent >= 75 ? 'altamente entrenado y reproducible' : 'en fase de adaptación'
                    }. Tu tiempo de respuesta promedio de ${summaryStats.avgReactionTimeMs} ms es óptimo para combates a corta distancia.`
                  : 'Completa al menos 3 sesiones de calibración para generar el diagnóstico completo de tu memoria muscular.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-500" />
                RECOMENDACIÓN DE CALIBRACIÓN
              </span>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                {trendResult.status === 'MEJORANDO'
                  ? 'Continúa con tu configuración actual. Los datos demuestran mejora progresiva continua.'
                  : trendResult.status === 'EMPEORANDO'
                  ? 'Aplica micro-ajustes progresivos de ±1 en General desde el Perfil Adaptativo para estabilizar tu puntería.'
                  : 'Tu calibración es sólida. Mantén la misma sensibilidad para perfeccionar levantamientos a la cabeza.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPARACIÓN (Última vs. Mejor vs. Promedio) (Section 5) */}
      {activeSubTab === 'comparacion' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <Scale className="w-4 h-4 text-red-500" />
                COMPARACIÓN DE RENDIMIENTO (ÚLTIMA vs. MEJOR vs. PROMEDIO)
              </span>
              <span className="text-zinc-400 text-[11px]">
                Diferencias numéricas calculadas contra tu récord y tu media histórica.
              </span>
            </div>

            <span className="text-[11px] font-mono text-zinc-400">
              Total sesiones: <strong className="text-white">{history.length}</strong>
            </span>
          </div>

          {comparisonMetrics.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center font-mono space-y-2 p-8">
              <Target className="w-8 h-8 text-zinc-600 animate-pulse" />
              <span className="text-zinc-400 font-bold text-xs">NO HAY DATOS SUFICIENTES PARA COMPARAR</span>
              <p className="text-[11px] text-zinc-500">Realiza al menos 1 test de calibración.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 my-1">
              {comparisonMetrics.map(row => {
                const isBetterThanAvg = row.isHigherBetter
                  ? row.diffLastVsAvg > 0
                  : row.diffLastVsAvg < 0;

                const isBetterThanBest = row.isHigherBetter
                  ? row.diffLastVsBest >= 0
                  : row.diffLastVsBest <= 0;

                return (
                  <div
                    key={row.label}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono gap-2"
                  >
                    <span className="font-bold text-zinc-300 w-52">{row.label}</span>

                    <div className="grid grid-cols-3 gap-2 flex-1 text-center">
                      {/* Última Sesión */}
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[9px] text-zinc-400 block">ÚLTIMA</span>
                        <span className="font-black text-white text-xs">
                          {row.lastValue} {row.unit}
                        </span>
                      </div>

                      {/* Mejor Sesión */}
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[9px] text-zinc-400 block">MEJOR</span>
                        <span className="font-black text-emerald-400 text-xs">
                          {row.bestValue} {row.unit}
                        </span>
                        <span className="text-[9px] block text-zinc-400">
                          Δ {row.diffLastVsBest > 0 ? `+${row.diffLastVsBest}` : row.diffLastVsBest}
                        </span>
                      </div>

                      {/* Promedio */}
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[9px] text-zinc-400 block">PROMEDIO</span>
                        <span className="font-black text-yellow-400 text-xs">
                          {row.avgValue} {row.unit}
                        </span>
                        <span
                          className={`text-[9px] block font-bold ${
                            isBetterThanAvg ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          Δ {row.diffLastVsAvg > 0 ? `+${row.diffLastVsAvg}` : row.diffLastVsAvg}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: OBJETIVOS INTERNOS (Section 7) */}
      {activeSubTab === 'objetivos' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <Target className="w-4 h-4 text-red-500" />
                OBJETIVOS INTERNOS DE ENTRENAMIENTO
              </span>
              <span className="text-zinc-400 text-[11px]">
                Define metas personalizadas y monitorea tu progreso con barras de avance.
              </span>
            </div>

            <button
              onClick={() => {
                gamerAudio.playSelect();
                setIsEditingGoals(!isEditingGoals);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-red-400" />
              <span>{isEditingGoals ? 'CANCELAR EDICIÓN' : 'CONFIGURAR OBJETIVOS'}</span>
            </button>
          </div>

          {/* Goal Edit Mode or Progress Mode */}
          {isEditingGoals ? (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-red-500/40 space-y-3 my-1">
              <h4 className="text-xs font-mono font-bold text-white">EDITAR METAS DE RENDIMIENTO:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">SCORE OBJETIVO (PTS):</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={tempGoals.targetScore}
                    onChange={e => setTempGoals({ ...tempGoals, targetScore: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-white font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">REACCIÓN OBJETIVO (MS):</label>
                  <input
                    type="number"
                    min="70"
                    max="250"
                    value={tempGoals.targetReactionTimeMs}
                    onChange={e => setTempGoals({ ...tempGoals, targetReactionTimeMs: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-yellow-400 font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">PRECISIÓN OBJETIVO (%):</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={tempGoals.targetAccuracyPercent}
                    onChange={e => setTempGoals({ ...tempGoals, targetAccuracyPercent: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-emerald-400 font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">CONSISTENCIA OBJETIVO (%):</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={tempGoals.targetConsistencyPercent}
                    onChange={e => setTempGoals({ ...tempGoals, targetConsistencyPercent: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-cyan-400 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveGoals}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>GUARDAR OBJETIVOS</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 my-1">
              {/* 1. Score Progress */}
              {(() => {
                const progress = getGoalProgress(summaryStats.bestScore, goals.targetScore);
                const isReached = summaryStats.bestScore >= goals.targetScore && summaryStats.bestScore > 0;
                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">🎯 SCORE OBJETIVO</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isReached ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isReached ? '¡OBJETIVO ALCANZADO!' : `${progress}%`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs font-mono text-zinc-300">
                      <span>Mejor Actual: <strong className="text-white">{summaryStats.bestScore} pts</strong></span>
                      <span>Meta: <strong className="text-red-400">{goals.targetScore} pts</strong></span>
                    </div>

                    <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_10px_#ff1e27]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* 2. Reaction Time Progress */}
              {(() => {
                const progress = getGoalProgress(summaryStats.bestReactionTimeMs, goals.targetReactionTimeMs, true);
                const isReached = summaryStats.bestReactionTimeMs > 0 && summaryStats.bestReactionTimeMs <= goals.targetReactionTimeMs;
                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">⚡️ TIEMPO DE REACCIÓN</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isReached ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isReached ? '¡OBJETIVO ALCANZADO!' : `${progress}%`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs font-mono text-zinc-300">
                      <span>Mejor Actual: <strong className="text-yellow-400">{summaryStats.bestReactionTimeMs} ms</strong></span>
                      <span>Meta: <strong className="text-yellow-400">≤ {goals.targetReactionTimeMs} ms</strong></span>
                    </div>

                    <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-500 shadow-[0_0_10px_#eab308]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* 3. Accuracy Progress */}
              {(() => {
                const progress = getGoalProgress(summaryStats.avgAccuracyPercent, goals.targetAccuracyPercent);
                const isReached = summaryStats.avgAccuracyPercent >= goals.targetAccuracyPercent && summaryStats.avgAccuracyPercent > 0;
                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">🎯 PRECISIÓN PROMEDIO</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isReached ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isReached ? '¡OBJETIVO ALCANZADO!' : `${progress}%`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs font-mono text-zinc-300">
                      <span>Promedio Actual: <strong className="text-emerald-400">{summaryStats.avgAccuracyPercent}%</strong></span>
                      <span>Meta: <strong className="text-emerald-400">{goals.targetAccuracyPercent}%</strong></span>
                    </div>

                    <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#10b981]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* 4. Consistency Progress */}
              {(() => {
                const progress = getGoalProgress(summaryStats.avgConsistencyPercent, goals.targetConsistencyPercent);
                const isReached = summaryStats.avgConsistencyPercent >= goals.targetConsistencyPercent && summaryStats.avgConsistencyPercent > 0;
                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">📐 CONSISTENCIA PROMEDIO</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isReached ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isReached ? '¡OBJETIVO ALCANZADO!' : `${progress}%`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs font-mono text-zinc-300">
                      <span>Promedio Actual: <strong className="text-cyan-400">{summaryStats.avgConsistencyPercent}%</strong></span>
                      <span>Meta: <strong className="text-cyan-400">{goals.targetConsistencyPercent}%</strong></span>
                    </div>

                    <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-500 shadow-[0_0_10px_#06b6d4]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: HISTORIAL DETALLADO DE SESIONES (Section 9) */}
      {activeSubTab === 'historial' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-red-500" />
                HISTORIAL DETALLADO DE SESIONES ({history.length})
              </span>
              <span className="text-zinc-400 text-[11px]">
                Visualiza, analiza o elimina sesiones registradas localmente.
              </span>
            </div>

            {history.length > 0 && (
              <button
                onClick={() => setShowClearAllModal(true)}
                className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/60 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>BORRAR TODO EL HISTORIAL</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center font-mono space-y-2 p-8">
              <Calendar className="w-8 h-8 text-zinc-600 animate-pulse" />
              <span className="text-zinc-400 font-bold text-xs">EL HISTORIAL ESTÁ VACÍO</span>
              <p className="text-[11px] text-zinc-500">
                Cada calibración completada se guardará aquí automáticamente.
              </p>
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  onNavigate('calibrator');
                }}
                className="mt-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow"
              >
                IR AL CALIBRADOR INTELIGENTE →
              </button>
            </div>
          ) : (
            <div className="space-y-2 flex-1 max-h-[380px] overflow-y-auto pr-1">
              {history.map((record, index) => {
                let dateFormatted = record.timestamp;
                try {
                  const d = new Date(record.timestamp);
                  if (!isNaN(d.getTime())) {
                    dateFormatted = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  }
                } catch {
                  // Fallback
                }

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:border-zinc-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-bold text-[10px]">
                          #{history.length - index}
                        </span>
                        <span className="text-zinc-400 text-[11px]">{dateFormatted}</span>
                        <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase">
                          {record.playerProfile?.mainWeapon || 'ESCOPETA'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 text-[10px]">
                          HUD: {record.playerProfile?.hudFingers || 3} Dedos
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {record.playerProfile?.deviceModel || 'iPhone'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-300 text-[11px] flex-wrap pt-0.5">
                        <span>Score: <strong className="text-white">{record.finalScore} pts</strong></span>
                        <span>Reacción: <strong className="text-yellow-400">{record.testMetrics?.avgReactionTimeMs || '--'} ms</strong></span>
                        <span>Precisión: <strong className="text-emerald-400">{record.testMetrics?.avgAccuracy || '--'}%</strong></span>
                        <span>Consistencia: <strong className="text-cyan-400">{record.testMetrics?.consistencyScore || '--'}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="text-right hidden sm:block">
                        <span className="text-[9px] text-zinc-500 block">SENSI GENERAL</span>
                        <span className="font-black text-white text-xs">
                          {record.initialSensi?.general || '--'} / 200
                        </span>
                      </div>

                      <button
                        onClick={() => setDeleteTargetId(record.id)}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-700 transition cursor-pointer"
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
      )}

      {/* Footer Banner & Fair Play Declaration (Section 10 & 11) */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SENSI 33 FAIR PLAY ENGINE • 100% Client-Side Sandbox • Sin modificación de Free Fire</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Escala: <strong>0–200</strong></span>
          <span>Almacenamiento: <strong>Local Seguro</strong></span>
        </div>
      </div>
    </div>
  );
};
