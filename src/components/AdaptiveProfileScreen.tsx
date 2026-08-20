import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Sliders,
  Scale,
  Smartphone,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Play,
  Copy,
  Layers,
  Crosshair,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Info,
  Save,
  Lock,
} from 'lucide-react';
import {
  DeviceInfo,
  CalibrationRecord,
  CalibrationSensiConfig,
  CalibrationPlayerProfile,
  ConfidenceAssessment,
  PlayerTrendAnalysis,
  AdaptiveAdjustment,
  WeaponSensiProfilesMap,
  DeviceAdaptiveProfile,
  EvolutionChartDataPoint,
  ScreenId,
} from '../types';
import { gamerAudio } from '../utils/audio';
import {
  DEFAULT_WEAPON_PROFILES,
  assessConfidence,
  analyzePlayerTrends,
  generateAdaptiveAdjustments,
  formatEvolutionData,
  clamp200,
} from '../utils/adaptiveProfileEngine';

interface AdaptiveProfileScreenProps {
  deviceInfo: DeviceInfo;
  onNavigate: (screen: ScreenId) => void;
}

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

export const AdaptiveProfileScreen: React.FC<AdaptiveProfileScreenProps> = ({
  deviceInfo,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'evolucion' | 'comparador' | 'armas' | 'dispositivos'>('resumen');

  // History & Calibration data loaded from localStorage
  const [history, setHistory] = useState<CalibrationRecord[]>([]);
  
  // Current active player profile
  const [playerProfile, setPlayerProfile] = useState<CalibrationPlayerProfile>({
    deviceModel: deviceInfo.model || 'iPhone 15 Pro Max',
    hudFingers: '3',
    fireButtonSize: 42,
    screenProtector: 'cristal',
    mainWeapon: 'escopeta',
  });

  // Current active sensitivity (0-200 scale)
  const [currentSensi, setCurrentSensi] = useState<CalibrationSensiConfig>(DEFAULT_WEAPON_PROFILES.escopeta);

  // Weapon profiles map
  const [weaponProfiles, setWeaponProfiles] = useState<WeaponSensiProfilesMap>(DEFAULT_WEAPON_PROFILES);

  // Saved multi-device profiles
  const [deviceProfiles, setDeviceProfiles] = useState<Record<string, DeviceAdaptiveProfile>>({});

  // Active adjustments state
  const [adjustments, setAdjustments] = useState<AdaptiveAdjustment[]>([]);
  const [testModeAdjustment, setTestModeAdjustment] = useState<AdaptiveAdjustment | null>(null);

  // Comparison selections (Config A vs Config B)
  const [configAKey, setConfigAKey] = useState<string>('actual');
  const [configBKey, setConfigBKey] = useState<string>('recomendada');

  // Evolution chart metric filter
  const [chartMetric, setChartMetric] = useState<'all' | 'score' | 'time' | 'acc' | 'cons'>('all');

  // UI Toast and Copy feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load all persisted data on mount
  useEffect(() => {
    try {
      // 1. History
      const storedHistory = localStorage.getItem('sensi33_calibration_history_v3');
      if (storedHistory) {
        const parsed: CalibrationRecord[] = JSON.parse(storedHistory);
        setHistory(parsed);
        if (parsed.length > 0 && parsed[0].initialSensi) {
          setCurrentSensi(parsed[0].initialSensi);
          if (parsed[0].playerProfile) {
            setPlayerProfile(parsed[0].playerProfile);
          }
        }
      }

      // 2. Weapon Profiles
      const storedWeapons = localStorage.getItem('sensi33_weapon_profiles_v3');
      if (storedWeapons) {
        setWeaponProfiles(JSON.parse(storedWeapons));
      }

      // 3. Multi-Device Profiles
      const storedDevices = localStorage.getItem('sensi33_device_profiles_v3');
      if (storedDevices) {
        setDeviceProfiles(JSON.parse(storedDevices));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Compute confidence & trends reactively
  const confidence: ConfidenceAssessment = assessConfidence(history.length);
  const trendAnalysis: PlayerTrendAnalysis = analyzePlayerTrends(history);
  const evolutionData: EvolutionChartDataPoint[] = formatEvolutionData(history);

  // Generate adaptive adjustments whenever current sensi or history changes
  useEffect(() => {
    const adj = generateAdaptiveAdjustments(currentSensi, trendAnalysis);
    setAdjustments(adj);
  }, [currentSensi, history]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Action: Aceptar Ajuste Adaptativo
  const handleAcceptAdjustment = (adjId: string) => {
    gamerAudio.playSelect();
    const adj = adjustments.find(a => a.id === adjId);
    if (!adj) return;

    // Apply to current sensi
    const updatedSensi: CalibrationSensiConfig = {
      ...currentSensi,
      [adj.parameter]: adj.recommendedValue,
    };
    setCurrentSensi(updatedSensi);

    // Mark as accepted
    setAdjustments(prev =>
      prev.map(a => (a.id === adjId ? { ...a, status: 'accepted' } : a))
    );

    // Save to active weapon profile
    const updatedWeaponMap = {
      ...weaponProfiles,
      [playerProfile.mainWeapon]: updatedSensi,
    };
    setWeaponProfiles(updatedWeaponMap);
    try {
      localStorage.setItem('sensi33_weapon_profiles_v3', JSON.stringify(updatedWeaponMap));
    } catch {
      // Ignore storage errors
    }

    if (testModeAdjustment?.id === adjId) {
      setTestModeAdjustment(null);
    }

    triggerToast(`¡Ajuste aplicado! ${adj.paramLabel} actualizado a ${adj.recommendedValue} / 200.`);
  };

  // Action: Rechazar Ajuste Adaptativo
  const handleRejectAdjustment = (adjId: string) => {
    gamerAudio.playClick();
    setAdjustments(prev =>
      prev.map(a => (a.id === adjId ? { ...a, status: 'rejected' } : a))
    );
    if (testModeAdjustment?.id === adjId) {
      setTestModeAdjustment(null);
    }
    triggerToast(`Ajuste descartado para ${adjId.replace('adj-', '')}.`);
  };

  // Action: Probar Ajuste Adaptativo en Modo Simulado
  const handleTestAdjustment = (adj: AdaptiveAdjustment) => {
    gamerAudio.playClick();
    setTestModeAdjustment(adj);
    triggerToast(`Probando ajuste: ${adj.paramLabel} a ${adj.recommendedValue}. Realiza pruebas para verificar.`);
  };

  // Action: Cambiar Perfil por Arma
  const handleSelectWeaponTab = (weapon: 'escopeta' | 'smg' | 'ar' | 'sniper' | 'onetap') => {
    gamerAudio.playSelect();
    setPlayerProfile(prev => ({ ...prev, mainWeapon: weapon }));
    if (weaponProfiles[weapon]) {
      setCurrentSensi(weaponProfiles[weapon]);
    }
    triggerToast(`Perfil cargado para arma: ${weapon.toUpperCase()}`);
  };

  // Action: Guardar Perfil por Arma
  const handleSaveWeaponProfile = (weapon: 'escopeta' | 'smg' | 'ar' | 'sniper' | 'onetap', newSensi: CalibrationSensiConfig) => {
    gamerAudio.playClick();
    const updated = {
      ...weaponProfiles,
      [weapon]: newSensi,
    };
    setWeaponProfiles(updated);
    try {
      localStorage.setItem('sensi33_weapon_profiles_v3', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    triggerToast(`¡Configuración guardada para ${weapon.toUpperCase()}!`);
  };

  // Action: Cambiar Dispositivo y Guardar Sin Sobrescribir Anteriores
  const handleSwitchDevice = (newModel: string) => {
    gamerAudio.playSelect();

    // 1. Save current state to current device record first
    const currentDeviceKey = playerProfile.deviceModel;
    const currentRec: DeviceAdaptiveProfile = {
      id: `dev-${currentDeviceKey.replace(/\s+/g, '-').toLowerCase()}`,
      deviceModel: currentDeviceKey,
      hudFingers: playerProfile.hudFingers,
      fireButtonSize: playerProfile.fireButtonSize,
      screenProtector: playerProfile.screenProtector,
      mainWeapon: playerProfile.mainWeapon,
      currentSensi: { ...currentSensi },
      weaponProfiles: { ...weaponProfiles },
      lastUpdated: new Date().toLocaleDateString(),
    };

    const updatedMap = {
      ...deviceProfiles,
      [currentDeviceKey]: currentRec,
    };
    setDeviceProfiles(updatedMap);

    // 2. Load target device profile if previously saved
    if (updatedMap[newModel]) {
      const target = updatedMap[newModel];
      setPlayerProfile({
        deviceModel: target.deviceModel,
        hudFingers: target.hudFingers,
        fireButtonSize: target.fireButtonSize,
        screenProtector: target.screenProtector,
        mainWeapon: target.mainWeapon,
      });
      setCurrentSensi(target.currentSensi);
      if (target.weaponProfiles) {
        setWeaponProfiles(target.weaponProfiles);
      }
    } else {
      // Fresh new device profile
      setPlayerProfile(prev => ({ ...prev, deviceModel: newModel }));
    }

    try {
      localStorage.setItem('sensi33_device_profiles_v3', JSON.stringify(updatedMap));
    } catch {
      // Ignore storage errors
    }
    triggerToast(`Dispositivo cambiado a: ${newModel}. Perfiles anteriores conservados.`);
  };

  // Action: Copiar Resumen del Perfil
  const handleCopyProfileSummary = () => {
    const text = `🔥 SENSI 33 - PERFIL ADAPTATIVO (ESCALA 0–200)\n📱 Dispositivo: ${playerProfile.deviceModel} • HUD: ${playerProfile.hudFingers} Dedos\n🔫 Arma Principal: ${playerProfile.mainWeapon.toUpperCase()} • Botón: ${playerProfile.fireButtonSize}%\n🛡️ Mica: ${playerProfile.screenProtector}\n📊 Calibraciones Realizadas: ${history.length} (Confianza: ${confidence.label})\n🎯 Mejor Score: ${trendAnalysis.bestCalibrationScore}/100 • Reacción Promedio: ${trendAnalysis.avgReactionTimeMs} ms\n\n⚡️ TENDENCIA ACTUAL: ${trendAnalysis.primaryTrendTitle}\n💡 RECOMENDACIÓN: ${trendAnalysis.primaryRecommendation}\n\n⚖️ SENSIBILIDAD ACTUAL:\n- General: ${currentSensi.general} / 200\n- Punto Rojo: ${currentSensi.redDot} / 200\n- Mira 2X: ${currentSensi.scope2x} / 200\n- Mira 4X: ${currentSensi.scope4x} / 200\n- Francotirador: ${currentSensi.sniperScope} / 200\n- Cámara / Free Look: ${currentSensi.freeLook} / 200\n\n🔒 100% Fair Play & Privacidad Local.`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    triggerToast('¡Resumen de Perfil Adaptativo copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to resolve config object for comparison
  const resolveConfigForComparison = (key: string): CalibrationSensiConfig => {
    if (key === 'actual') return currentSensi;
    if (key === 'recomendada') {
      const topAdj = adjustments[0];
      return {
        ...currentSensi,
        general: topAdj ? topAdj.recommendedValue : currentSensi.general,
        redDot: adjustments[1] ? adjustments[1].recommendedValue : currentSensi.redDot,
        scope2x: adjustments[2] ? adjustments[2].recommendedValue : currentSensi.scope2x,
        scope4x: adjustments[3] ? adjustments[3].recommendedValue : currentSensi.scope4x,
      };
    }
    if (key in weaponProfiles) {
      return weaponProfiles[key as keyof WeaponSensiProfilesMap];
    }
    return currentSensi;
  };

  const configAData = resolveConfigForComparison(configAKey);
  const configBData = resolveConfigForComparison(configBKey);

  // Highest priority adjustment for "SIGUIENTE AJUSTE" card
  const primaryAdjustment = adjustments.find(a => a.status === 'pending') || adjustments[0];

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
              V3 ADAPTIVE ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ESCALA 0–200
            </span>
            <span className="text-xs font-mono text-zinc-400">HISTORIAL EVOLUTIVO & PERFIL DEL JUGADOR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            PERFIL ADAPTATIVO SENSI 33
          </h2>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 flex-wrap">
          {[
            { id: 'resumen', label: '1. MI PERFIL' },
            { id: 'evolucion', label: '2. EVOLUCIÓN' },
            { id: 'comparador', label: '3. COMPARADOR' },
            { id: 'armas', label: '4. ARMAS' },
            { id: 'dispositivos', label: '5. DISPOSITIVOS' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                gamerAudio.playSelect();
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: RESUMEN DEL PERFIL, TENDENCIAS, AJUSTE ADAPTATIVO Y CONFIANZA */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-2.5 flex-1">
          {/* Left Column: Player Card & Confidence Gauge (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            {/* Player Card (Section 1) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-red-500" />
                  MI PERFIL DE JUGADOR
                </span>
                <span className="text-emerald-400 font-bold text-[10px]">ACTIVO EN SENSI 33</span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">DISPOSITIVO</span>
                  <span className="font-bold text-white truncate block text-[11px]">{playerProfile.deviceModel}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">HUD UTILIZADO</span>
                  <span className="font-bold text-white">{playerProfile.hudFingers} Dedos</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">BOTÓN DE DISPARO</span>
                  <span className="font-bold text-red-400">{playerProfile.fireButtonSize}%</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">TIPO DE MICA</span>
                  <span className="font-bold text-white capitalize">{playerProfile.screenProtector}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">ARMA PRINCIPAL</span>
                  <span className="font-bold text-yellow-400 uppercase">{playerProfile.mainWeapon}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">CALIBRACIONES</span>
                  <span className="font-bold text-emerald-400">{history.length} pruebas</span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block">MEJOR RESULTADO</span>
                  <span className="font-black text-lg text-white italic">
                    {trendAnalysis.bestCalibrationScore > 0 ? `${trendAnalysis.bestCalibrationScore}/100` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block">PROMEDIO REACCIÓN</span>
                  <span className="font-bold text-lg text-yellow-400">
                    {trendAnalysis.avgReactionTimeMs > 0 ? `${trendAnalysis.avgReactionTimeMs} ms` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence System (Section 5) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  SISTEMA DE CONFIANZA ESTADÍSTICA
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    confidence.tier === 'high'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : confidence.tier === 'medium'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : confidence.tier === 'low'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {confidence.label} ({history.length} tests)
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      confidence.tier === 'high'
                        ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                        : confidence.tier === 'medium'
                        ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'
                        : confidence.tier === 'low'
                        ? 'bg-yellow-500'
                        : 'bg-zinc-700'
                    }`}
                    style={{ width: `${Math.max(10, confidence.percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                  <span>1-2: Insuficiente</span>
                  <span>3-5: Baja</span>
                  <span>6-9: Media</span>
                  <span>10+: Alta</span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                {confidence.description}
              </p>

              <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span>Muestreo matemático transparente. No es IA médica ni medición oficial de habilidad.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tendencias, Siguiente Ajuste & Acciones (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            {/* Tendencia Actual Card (Section 2 & 3) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  TENDENCIA ACTUAL DETECTADA
                </span>
                <span className="text-zinc-400 text-[10px]">ANÁLISIS DE TESTS SENSI 33</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-mono text-red-400">
                    {trendAnalysis.primaryTrendTitle}
                  </h4>
                  <div className="flex gap-1 flex-wrap">
                    {trendAnalysis.detectedLabels.map((lbl, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono text-[10px] font-bold border border-zinc-700"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-xs font-mono space-y-1">
                  <span className="text-zinc-400 font-bold block text-[10px]">RECOMENDACIÓN TÁCTIL:</span>
                  <p className="text-emerald-300 font-medium text-xs leading-relaxed">
                    {trendAnalysis.primaryRecommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Siguiente Ajuste Adaptativo Card (Section 4 & 10) */}
            {primaryAdjustment && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/50 via-zinc-900/90 to-zinc-950 border border-red-500/40 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(255,30,39,0.15)]">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-xs font-mono">
                  <span className="text-white font-black flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-red-400" />
                    SIGUIENTE AJUSTE ADAPTATIVO
                  </span>
                  <span className="text-yellow-400 font-bold text-[10px]">RECOMENDACIÓN GRADUAL (±1 A ±5)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 block">PARÁMETRO</span>
                    <span className="font-bold text-white text-xs">{primaryAdjustment.paramLabel}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 block">ACTUAL</span>
                    <span className="font-black text-white text-sm">{primaryAdjustment.currentValue} / 200</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 block">RECOMENDADO</span>
                    <span className="font-black text-emerald-400 text-sm">{primaryAdjustment.recommendedValue} / 200</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 block">CAMBIO</span>
                    <span
                      className={`font-black text-sm ${
                        primaryAdjustment.delta > 0
                          ? 'text-emerald-400'
                          : primaryAdjustment.delta < 0
                          ? 'text-red-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {primaryAdjustment.delta > 0 ? `+${primaryAdjustment.delta}` : primaryAdjustment.delta}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 text-[11px] font-mono text-zinc-300">
                  <span className="text-red-400 font-bold">MOTIVO: </span>
                  <span>{primaryAdjustment.reason}</span>
                </div>

                {/* User Approval Action Buttons: PROBAR / ACEPTAR / RECHAZAR (Section 4) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    id="btn-test-adaptive-adj"
                    onClick={() => handleTestAdjustment(primaryAdjustment)}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 font-mono text-xs font-bold border border-yellow-500/40 hover:border-yellow-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>PROBAR</span>
                  </button>
                  <button
                    id="btn-accept-adaptive-adj"
                    onClick={() => handleAcceptAdjustment(primaryAdjustment.id)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ACEPTAR</span>
                  </button>
                  <button
                    id="btn-reject-adaptive-adj"
                    onClick={() => handleRejectAdjustment(primaryAdjustment.id)}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 font-mono text-xs font-bold border border-zinc-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>RECHAZAR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions Footer Strip */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  onNavigate('calibrator');
                }}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>NUEVA CALIBRACIÓN DE FLICK →</span>
              </button>

              <button
                onClick={handleCopyProfileSummary}
                className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIADO' : 'COPIAR PERFIL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: HISTORIAL EVOLUTIVO (GRÁFICA Y MÉTRICAS) */}
      {activeTab === 'evolucion' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <BarChart3 className="w-4 h-4 text-red-500" />
                GRÁFICA DE EVOLUCIÓN & CONSISTENCIA
              </span>
              <span className="text-zinc-400 text-[11px]">
                {history.length > 0
                  ? `Mostrando ${history.length} calibraciones registradas`
                  : 'Sin calibraciones registradas aún'}
              </span>
            </div>

            {/* Metric Selector Filter (Section 6) */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  setChartMetric('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                  chartMetric === 'all' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TODAS
              </button>
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  setChartMetric('score');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                  chartMetric === 'score' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                SCORE
              </button>
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  setChartMetric('time');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                  chartMetric === 'time' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                TIEMPO (MS)
              </button>
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  setChartMetric('acc');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                  chartMetric === 'acc' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                PRECISIÓN (%)
              </button>
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  setChartMetric('cons');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                  chartMetric === 'cons' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                CONSISTENCIA (%)
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="flex-1 min-h-[220px] rounded-2xl bg-zinc-950 border border-zinc-800 p-4 relative overflow-hidden flex flex-col justify-between">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2026_1px,transparent_1px),linear-gradient(to_bottom,#1f2026_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 pointer-events-none" />

            {evolutionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center font-mono space-y-2 z-10 my-auto">
                <Target className="w-10 h-10 text-zinc-600 animate-pulse" />
                <span className="text-zinc-300 font-bold text-xs">NO HAY DATOS DE EVOLUCIÓN AÚN</span>
                <p className="text-[11px] text-zinc-500 max-w-sm">
                  Realiza pruebas en el Calibrador Inteligente para graficar tu tiempo de reacción, consistencia y score benchmark.
                </p>
                <button
                  onClick={() => {
                    gamerAudio.playSelect();
                    onNavigate('calibrator');
                  }}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  REALIZAR TEST DE FLICK →
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between z-10">
                {/* SVG Visualizer */}
                <div className="w-full flex-1 relative flex items-end">
                  <svg className="w-full h-40 overflow-visible">
                    {/* Horizontal reference guidelines */}
                    <line x1="0" y1="20" x2="100%" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                    <line x1="0" y1="70" x2="100%" y2="70" stroke="#27272a" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="100%" y2="120" stroke="#27272a" strokeDasharray="3 3" />

                    {/* Polyline: Calibration Score (Red) */}
                    {(chartMetric === 'all' || chartMetric === 'score') && (
                      <polyline
                        fill="none"
                        stroke="#ff1e27"
                        strokeWidth="3"
                        points={evolutionData
                          .map((d, i) => {
                            const x = evolutionData.length === 1 ? 50 : (i / (evolutionData.length - 1)) * 90 + 5;
                            const y = 140 - (d.calibrationScore / 100) * 120;
                            return `${x}%,${y}`;
                          })
                          .join(' ')}
                      />
                    )}

                    {/* Polyline: Precision / Accuracy (Emerald) */}
                    {(chartMetric === 'all' || chartMetric === 'acc') && (
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray={chartMetric === 'all' ? '4 2' : 'none'}
                        points={evolutionData
                          .map((d, i) => {
                            const x = evolutionData.length === 1 ? 50 : (i / (evolutionData.length - 1)) * 90 + 5;
                            const y = 140 - (d.accuracyPercent / 100) * 120;
                            return `${x}%,${y}`;
                          })
                          .join(' ')}
                      />
                    )}

                    {/* Polyline: Reaction Time (Yellow inverted for lower = better) */}
                    {(chartMetric === 'all' || chartMetric === 'time') && (
                      <polyline
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2"
                        points={evolutionData
                          .map((d, i) => {
                            const x = evolutionData.length === 1 ? 50 : (i / (evolutionData.length - 1)) * 90 + 5;
                            // Clamp 80ms to 240ms into 0-140px range
                            const norm = Math.max(0, Math.min(1, (240 - d.reactionTimeMs) / 160));
                            const y = 140 - norm * 120;
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
                        points={evolutionData
                          .map((d, i) => {
                            const x = evolutionData.length === 1 ? 50 : (i / (evolutionData.length - 1)) * 90 + 5;
                            const y = 140 - (d.consistencyScore / 100) * 120;
                            return `${x}%,${y}`;
                          })
                          .join(' ')}
                      />
                    )}

                    {/* Interactive Data Nodes */}
                    {evolutionData.map((d, i) => {
                      const x = evolutionData.length === 1 ? 50 : (i / (evolutionData.length - 1)) * 90 + 5;
                      const yScore = 140 - (d.calibrationScore / 100) * 120;
                      return (
                        <g key={d.testId}>
                          <circle
                            cx={`${x}%`}
                            cy={yScore}
                            r="5"
                            fill="#ffffff"
                            stroke="#ff1e27"
                            strokeWidth="2"
                            className="cursor-pointer hover:r-7 transition-all"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                  {evolutionData.map((d, i) => (
                    <span key={d.testId} className="truncate max-w-[80px]">
                      #{i + 1} ({d.calibrationScore} pts)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evolution Metric Legend Strip & Jump Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono flex-1 w-full">
              <div className="p-2 rounded-xl bg-zinc-950 border border-red-500/30 flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-zinc-300">Score (0-100)</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-yellow-500/30 flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="text-zinc-300">Reacción (ms)</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">Precisión (%)</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-cyan-500/30 flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-zinc-300">Consistencia (%)</span>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => {
                  gamerAudio.playSelect();
                  onNavigate('evolution');
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow flex-shrink-0"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>ABRIR MODO EVOLUCIÓN COMPLETO →</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: COMPARADOR DE CONFIGURACIONES (A vs B) */}
      {activeTab === 'comparador' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <Scale className="w-4 h-4 text-red-500" />
                COMPARADOR DE SENSIBILIDADES (0–200)
              </span>
              <span className="text-zinc-400 text-[11px]">
                Compara 2 configuraciones lado a lado y visualiza diferencias milimétricas.
              </span>
            </div>

            {/* Selectors for Config A & Config B (Section 7) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 font-bold">CONFIG A:</span>
                <select
                  value={configAKey}
                  onChange={e => setConfigAKey(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-xs font-mono rounded-lg px-2 py-1 text-white focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="actual">Actual ({playerProfile.mainWeapon})</option>
                  <option value="escopeta">Escopeta</option>
                  <option value="smg">SMG</option>
                  <option value="ar">AR Asalto</option>
                  <option value="sniper">Sniper</option>
                  <option value="onetap">One-Tap</option>
                </select>
              </div>

              <span className="text-red-500 font-black">VS.</span>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 font-bold">CONFIG B:</span>
                <select
                  value={configBKey}
                  onChange={e => setConfigBKey(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-xs font-mono rounded-lg px-2 py-1 text-emerald-400 focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="recomendada">Recomendada Adaptativa</option>
                  <option value="escopeta">Escopeta</option>
                  <option value="smg">SMG</option>
                  <option value="ar">AR Asalto</option>
                  <option value="sniper">Sniper</option>
                  <option value="onetap">One-Tap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="space-y-1.5 flex-1 my-1">
            {[
              { label: 'GENERAL', valA: configAData.general, valB: configBData.general },
              { label: 'PUNTO ROJO', valA: configAData.redDot, valB: configBData.redDot },
              { label: 'MIRA 2X', valA: configAData.scope2x, valB: configBData.scope2x },
              { label: 'MIRA 4X', valA: configAData.scope4x, valB: configBData.scope4x },
              { label: 'FRANCOTIRADOR', valA: configAData.sniperScope, valB: configBData.sniperScope },
              { label: 'CÁMARA / FREE LOOK', valA: configAData.freeLook, valB: configBData.freeLook },
            ].map(row => {
              const diff = row.valB - row.valA;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono"
                >
                  <span className="font-bold text-zinc-300 w-44">{row.label}</span>

                  <div className="flex items-center gap-6 flex-1 justify-center">
                    <div className="text-center w-24">
                      <span className="text-[10px] text-zinc-500 block">CONFIG A</span>
                      <span className="font-bold text-white text-sm">{row.valA} / 200</span>
                    </div>

                    <div className="text-center w-16">
                      <span
                        className={`px-2 py-0.5 rounded font-black text-xs ${
                          diff > 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : diff < 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                      </span>
                    </div>

                    <div className="text-center w-24">
                      <span className="text-[10px] text-zinc-500 block">CONFIG B</span>
                      <span className="font-bold text-emerald-400 text-sm">{row.valB} / 200</span>
                    </div>
                  </div>

                  <div className="w-32 text-right">
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${(row.valB / 200) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Apply / Copy strip */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400">
              Presiona para sincronizar la Config B directamente a tu sensibilidad activa.
            </span>
            <button
              onClick={() => {
                gamerAudio.playSelect();
                setCurrentSensi(configBData);
                triggerToast('¡Configuración B aplicada a tu sensibilidad activa!');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>APLICAR CONFIG B AHORA</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: PERFILES POR ARMA (ESCOPETA, SMG, AR, SNIPER, ONE TAP) */}
      {activeTab === 'armas' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <Layers className="w-4 h-4 text-red-500" />
                PERFILES POR CATEGORÍA DE ARMA (ESCALA 0–200)
              </span>
              <span className="text-zinc-400 text-[11px]">
                Guarda configuraciones independientes para cada estilo y arma principal.
              </span>
            </div>

            {/* Weapon Selector Tabs (Section 8) */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {[
                { id: 'escopeta', label: '💥 ESCOPETA' },
                { id: 'smg', label: '⚡️ SMG' },
                { id: 'ar', label: '🎯 AR' },
                { id: 'sniper', label: '🔭 SNIPER' },
                { id: 'onetap', label: '🔥 ONE-TAP' },
              ].map(w => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWeaponTab(w.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    playerProfile.mainWeapon === w.id
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Weapon Sliders (0-200) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 my-1">
            {[
              { key: 'general', label: 'GENERAL' },
              { key: 'redDot', label: 'PUNTO ROJO' },
              { key: 'scope2x', label: 'MIRA 2X' },
              { key: 'scope4x', label: 'MIRA 4X' },
              { key: 'sniperScope', label: 'FRANCOTIRADOR' },
              { key: 'freeLook', label: 'CÁMARA / FREE LOOK' },
            ].map(item => {
              const currentVal = weaponProfiles[playerProfile.mainWeapon][item.key as keyof CalibrationSensiConfig];
              return (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5"
                >
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">{item.label}</span>
                    <span className="text-red-400 font-black">{currentVal} / 200</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const updated = {
                          ...weaponProfiles[playerProfile.mainWeapon],
                          [item.key]: clamp200(currentVal - 1),
                        };
                        handleSaveWeaponProfile(playerProfile.mainWeapon, updated);
                      }}
                      className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={currentVal}
                      onChange={e => {
                        const updated = {
                          ...weaponProfiles[playerProfile.mainWeapon],
                          [item.key]: clamp200(+e.target.value),
                        };
                        handleSaveWeaponProfile(playerProfile.mainWeapon, updated);
                      }}
                      className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => {
                        const updated = {
                          ...weaponProfiles[playerProfile.mainWeapon],
                          [item.key]: clamp200(currentVal + 1),
                        };
                        handleSaveWeaponProfile(playerProfile.mainWeapon, updated);
                      }}
                      className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Save & Reset Strip */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400">
              Perfil activo: <strong className="text-white uppercase">{playerProfile.mainWeapon}</strong>. Los cambios se guardan automáticamente en tu dispositivo.
            </span>
            <button
              onClick={() => {
                gamerAudio.playClick();
                const def = DEFAULT_WEAPON_PROFILES[playerProfile.mainWeapon];
                handleSaveWeaponProfile(playerProfile.mainWeapon, def);
                triggerToast(`Valores por defecto restaurados para ${playerProfile.mainWeapon.toUpperCase()}`);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTAURAR DEFECTO</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 5: PERFILES POR DISPOSITIVO (MULTI-DISPOSITIVO SIN SOBREESCRIBIR) */}
      {activeTab === 'dispositivos' && (
        <div className="flex-1 flex flex-col justify-between my-2.5 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                <Smartphone className="w-4 h-4 text-red-500" />
                GESTIÓN MULTI-DISPOSITIVO (SIN PÉRDIDA DE DATOS)
              </span>
              <span className="text-zinc-400 text-[11px]">
                Cambia de dispositivo libremente conservando tus perfiles y calibraciones previas.
              </span>
            </div>

            {/* Current Device Tag */}
            <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs">
              ACTUAL: {playerProfile.deviceModel}
            </span>
          </div>

          {/* Device Grid (Section 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-1 my-1 overflow-y-auto pr-1">
            {IPHONE_OPTIONS.map(opt => {
              const isCurrent = playerProfile.deviceModel === opt;
              const hasSavedProfile = !!deviceProfiles[opt];

              return (
                <div
                  key={opt}
                  className={`p-3 rounded-2xl border transition flex flex-col justify-between space-y-2 ${
                    isCurrent
                      ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(255,30,39,0.3)]'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white truncate">{opt}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-black">
                        ACTIVO
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 space-y-0.5">
                    <div>Estado: {hasSavedProfile ? <span className="text-emerald-400 font-bold">Perfil Personalizado</span> : <span className="text-zinc-500">Configuración Base</span>}</div>
                    {hasSavedProfile && (
                      <div>Última actualización: {deviceProfiles[opt].lastUpdated}</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSwitchDevice(opt)}
                    disabled={isCurrent}
                    className={`w-full py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-red-600/80 hover:bg-red-600 text-white shadow'
                    }`}
                  >
                    {isCurrent ? 'DISPOSITIVO EN USO' : 'SELECCIONAR & CARGAR'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Privacy & Fair Play Notice (Sections 11 & 12) */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Privacidad 100% Local: Las configuraciones se guardan en el almacenamiento local de tu navegador.</span>
            </div>
            <span className="text-emerald-400 font-bold">100% FAIR PLAY</span>
          </div>
        </div>
      )}

      {/* Footer Strip: Fair Play & Legal Guarantee */}
      <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-500 gap-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SENSI 33 es 100% legal e informativo. No inyecta código ni modifica archivos de Free Fire.</span>
        </div>
        <span>ESCALA OFICIAL 0–200 • V3 ADAPTIVE PROFILE</span>
      </div>
    </div>
  );
};
