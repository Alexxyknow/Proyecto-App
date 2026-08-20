import React, { useState, useEffect } from 'react';
import {
  Zap,
  Crosshair,
  Smartphone,
  Sliders,
  ShieldCheck,
  Check,
  Copy,
  RotateCcw,
  Save,
  FolderOpen,
  Layers,
  Sparkles,
  Eye,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { DeviceInfo, WeaponPreset, SensitivityProfile } from '../types';
import { gamerAudio } from '../utils/audio';

interface SensiConfigScreenProps {
  deviceInfo: DeviceInfo;
}

const WEAPON_PRESETS: WeaponPreset[] = [
  {
    id: 'wp-shotgun',
    name: 'Escopetas (M1887 / M1014 / SPAS)',
    category: 'escopetas',
    icon: '💥',
    general: 196,
    redDot: 190,
    scope2x: 180,
    scope4x: 168,
    sniperScope: 120,
    freeLook: 150,
    fireButtonSize: 38,
    liftTechnique: 'Levantamiento rápido en forma de "J" con pulsación corta y explosiva.',
    description: 'Prioriza máxima agilidad para headshots en PvP a corta distancia (Escala 0–200).',
  },
  {
    id: 'wp-smg',
    name: 'SMG (MP40 / UMP / Thompson / Vector)',
    category: 'smg',
    icon: '⚡️',
    general: 190,
    redDot: 184,
    scope2x: 174,
    scope4x: 160,
    sniperScope: 124,
    freeLook: 145,
    fireButtonSize: 42,
    liftTechnique: 'Deslizamiento continuo vertical medio con seguimiento suave de objetivo.',
    description: 'Control de retroceso balanceado para ráfagas continuas (Escala 0–200).',
  },
  {
    id: 'wp-ar',
    name: 'Rifles de Asalto (SCAR / AK / M4 / Groza)',
    category: 'ar',
    icon: '🎯',
    general: 184,
    redDot: 172,
    scope2x: 166,
    scope4x: 154,
    sniperScope: 110,
    freeLook: 140,
    fireButtonSize: 46,
    liftTechnique: 'Levantamiento suave para distancias medias, evitando dispersión.',
    description: 'Precisión quirúrgica a media y larga distancia con mira 2x y 4x (Escala 0–200).',
  },
  {
    id: 'wp-sniper',
    name: 'Francotiradores (AWM / M82B / Barret)',
    category: 'sniper',
    icon: '🔭',
    general: 176,
    redDot: 160,
    scope2x: 150,
    scope4x: 138,
    sniperScope: 92,
    freeLook: 130,
    fireButtonSize: 52,
    liftTechnique: 'Disparo con cambio rápido a mano/arma secundaria sin levantamiento abrupto.',
    description: 'Firmeza y cero temblor en el visor de largo alcance (Escala 0–200).',
  },
  {
    id: 'wp-pistol',
    name: 'Pistolas (Desert Eagle / M500)',
    category: 'pistolas',
    icon: '🔥',
    general: 195,
    redDot: 188,
    scope2x: 178,
    scope4x: 166,
    sniperScope: 120,
    freeLook: 150,
    fireButtonSize: 40,
    liftTechnique: 'One-Tap seco hacia la cabeza con suelta instantánea.',
    description: 'Configuración calibrada para tiros únicos a la cabeza (Escala 0–200).',
  },
];

const IPHONE_MODELS = [
  { id: 'ip16pm', name: 'iPhone 16 Pro Max (6.9" 120Hz ProMotion)', hz: 120, offset: 4 },
  { id: 'ip16p', name: 'iPhone 16 Pro (6.3" 120Hz ProMotion)', hz: 120, offset: 2 },
  { id: 'ip16', name: 'iPhone 16 / 16 Plus (60Hz A18)', hz: 60, offset: 0 },
  { id: 'ip15pm', name: 'iPhone 15 Pro Max (6.7" 120Hz ProMotion)', hz: 120, offset: 4 },
  { id: 'ip15p', name: 'iPhone 15 Pro (6.1" 120Hz ProMotion)', hz: 120, offset: 2 },
  { id: 'ip15', name: 'iPhone 15 / 15 Plus (60Hz)', hz: 60, offset: 0 },
  { id: 'ip14pm', name: 'iPhone 14 Pro Max / 14 Pro (120Hz)', hz: 120, offset: 4 },
  { id: 'ip14', name: 'iPhone 14 / 13 / 12 Series (60Hz)', hz: 60, offset: -2 },
  { id: 'ip11', name: 'iPhone 11 / XR / SE 2/3 (60Hz)', hz: 60, offset: -4 },
  { id: 'ipad', name: 'iPad Pro / iPad Air / Mini (Tablet)', hz: 120, offset: -16 },
];

export const SensiConfigScreen: React.FC<SensiConfigScreenProps> = ({ deviceInfo }) => {
  const [selectedWeapon, setSelectedWeapon] = useState<string>('wp-shotgun');
  const [selectedModel, setSelectedModel] = useState<string>('ip15pm');
  const [screenProtector, setScreenProtector] = useState<'cristal' | 'mate' | 'ninguno'>('cristal');
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SensitivityProfile[]>([]);
  const [profileNameInput, setProfileNameInput] = useState('');

  const activeWeapon = WEAPON_PRESETS.find(w => w.id === selectedWeapon) || WEAPON_PRESETS[0];
  const activeModelObj = IPHONE_MODELS.find(m => m.id === selectedModel) || IPHONE_MODELS[3];

  // Screen protector modifier for 0-200 scale (+4 for mate, 0 for glass, -2 for none)
  const protectorOffset = screenProtector === 'mate' ? 4 : screenProtector === 'cristal' ? 0 : -2;

  // Custom adjustable values (Scale 0 - 200)
  const calculateDefault = (baseVal: number, offset: number) => {
    return Math.min(200, Math.max(0, baseVal + offset));
  };

  const [customGeneral, setCustomGeneral] = useState<number>(() =>
    calculateDefault(activeWeapon.general, activeModelObj.offset + protectorOffset)
  );
  const [customRedDot, setCustomRedDot] = useState<number>(() =>
    calculateDefault(activeWeapon.redDot, activeModelObj.offset + protectorOffset)
  );
  const [customScope2x, setCustomScope2x] = useState<number>(() =>
    calculateDefault(activeWeapon.scope2x, activeModelObj.offset)
  );
  const [customScope4x, setCustomScope4x] = useState<number>(() =>
    calculateDefault(activeWeapon.scope4x, activeModelObj.offset)
  );
  const [customSniper, setCustomSniper] = useState<number>(() =>
    calculateDefault(activeWeapon.sniperScope, 0)
  );
  const [customFreeLook, setCustomFreeLook] = useState<number>(() =>
    calculateDefault(activeWeapon.freeLook || 140, activeModelObj.offset)
  );
  const [customFireButton, setCustomFireButton] = useState<number>(activeWeapon.fireButtonSize);

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sensi33_custom_profiles_v2');
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleWeaponChange = (weaponId: string) => {
    gamerAudio.playSelect();
    setSelectedWeapon(weaponId);
    const w = WEAPON_PRESETS.find(item => item.id === weaponId) || WEAPON_PRESETS[0];
    setCustomGeneral(calculateDefault(w.general, activeModelObj.offset + protectorOffset));
    setCustomRedDot(calculateDefault(w.redDot, activeModelObj.offset + protectorOffset));
    setCustomScope2x(calculateDefault(w.scope2x, activeModelObj.offset));
    setCustomScope4x(calculateDefault(w.scope4x, activeModelObj.offset));
    setCustomSniper(calculateDefault(w.sniperScope, 0));
    setCustomFreeLook(calculateDefault(w.freeLook || 140, activeModelObj.offset));
    setCustomFireButton(w.fireButtonSize);
  };

  const handleModelChange = (modelId: string) => {
    gamerAudio.playSelect();
    setSelectedModel(modelId);
    const m = IPHONE_MODELS.find(item => item.id === modelId) || IPHONE_MODELS[0];
    setCustomGeneral(calculateDefault(activeWeapon.general, m.offset + protectorOffset));
    setCustomRedDot(calculateDefault(activeWeapon.redDot, m.offset + protectorOffset));
    setCustomScope2x(calculateDefault(activeWeapon.scope2x, m.offset));
    setCustomScope4x(calculateDefault(activeWeapon.scope4x, m.offset));
    setCustomFreeLook(calculateDefault(activeWeapon.freeLook || 140, m.offset));
  };

  const handleProtectorChange = (type: 'cristal' | 'mate' | 'ninguno') => {
    gamerAudio.playSelect();
    setScreenProtector(type);
    const newProtOffset = type === 'mate' ? 4 : type === 'cristal' ? 0 : -2;
    setCustomGeneral(calculateDefault(activeWeapon.general, activeModelObj.offset + newProtOffset));
    setCustomRedDot(calculateDefault(activeWeapon.redDot, activeModelObj.offset + newProtOffset));
  };

  const handleResetDefaults = () => {
    gamerAudio.playClick();
    setCustomGeneral(calculateDefault(activeWeapon.general, activeModelObj.offset + protectorOffset));
    setCustomRedDot(calculateDefault(activeWeapon.redDot, activeModelObj.offset + protectorOffset));
    setCustomScope2x(calculateDefault(activeWeapon.scope2x, activeModelObj.offset));
    setCustomScope4x(calculateDefault(activeWeapon.scope4x, activeModelObj.offset));
    setCustomSniper(calculateDefault(activeWeapon.sniperScope, 0));
    setCustomFreeLook(calculateDefault(activeWeapon.freeLook || 140, activeModelObj.offset));
    setCustomFireButton(activeWeapon.fireButtonSize);
    triggerNotify('¡Ajustes restablecidos al preset oficial (Escala 0–200)!');
  };

  const copyConfigSummary = () => {
    gamerAudio.playClick();
    const text = `🔥 SENSI 33 - CONFIGURACIÓN GAMING (ESCALA 0–200)\n📱 Dispositivo: ${activeModelObj.name}\n🔫 Categoría: ${activeWeapon.name}\n🛡️ Protector: ${screenProtector === 'mate' ? 'Mica Cerámica Mate' : screenProtector === 'cristal' ? 'Cristal Templado 9D' : 'Sin Mica'}\n\n⚙️ SENSIBILIDADES (0 a 200):\n- General: ${customGeneral} / 200\n- Punto Rojo: ${customRedDot} / 200\n- Mira 2X: ${customScope2x} / 200\n- Mira 4X: ${customScope4x} / 200\n- Mira Francotirador: ${customSniper} / 200\n- Cámara / Free Look: ${customFreeLook} / 200\n- Botón de Disparo: ${customFireButton}%\n\n💡 Técnica de tiro: ${activeWeapon.liftTechnique}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    triggerNotify('¡Configuración copiada al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    gamerAudio.playClick();
    const name = profileNameInput.trim() || `Mi Sensi (${activeWeapon.name.split(' ')[0]})`;
    const newProfile: SensitivityProfile = {
      id: `profile-${Date.now()}`,
      name,
      targetDevice: activeModelObj.name,
      playStyle: 'rusher',
      general: customGeneral,
      redDot: customRedDot,
      scope2x: customScope2x,
      scope4x: customScope4x,
      sniperScope: customSniper,
      freeLook: customFreeLook,
      fireButtonSize: customFireButton,
      fireButtonPosition: 'Inferior Derecha',
      dpiRecommended: 'AssistiveTouch 100%',
      notes: `Protector: ${screenProtector}`,
      savedAt: new Date().toLocaleDateString(),
    };

    const updated = [newProfile, ...savedProfiles.slice(0, 7)];
    setSavedProfiles(updated);
    try {
      localStorage.setItem('sensi33_custom_profiles_v2', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    setProfileNameInput('');
    triggerNotify(`¡Perfil "${name}" guardado con éxito!`);
  };

  const handleLoadProfile = (p: SensitivityProfile) => {
    gamerAudio.playSelect();
    setCustomGeneral(Math.min(200, Math.max(0, p.general)));
    setCustomRedDot(Math.min(200, Math.max(0, p.redDot)));
    setCustomScope2x(Math.min(200, Math.max(0, p.scope2x)));
    setCustomScope4x(Math.min(200, Math.max(0, p.scope4x)));
    setCustomSniper(Math.min(200, Math.max(0, p.sniperScope)));
    setCustomFreeLook(Math.min(200, Math.max(0, p.freeLook ?? 140)));
    setCustomFireButton(Math.min(75, Math.max(25, p.fireButtonSize)));
    setShowSavedModal(false);
    triggerNotify(`¡Perfil "${p.name}" cargado!`);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    gamerAudio.playClick();
    const updated = savedProfiles.filter(p => p.id !== id);
    setSavedProfiles(updated);
    try {
      localStorage.setItem('sensi33_custom_profiles_v2', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  // Helper clamp for 0-200
  const clamp200 = (val: number) => Math.min(200, Math.max(0, isNaN(val) ? 0 : val));

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white relative">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(255,30,39,0.8)] border border-red-400 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header with Scale 0-200 Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              CALIBRADOR PRO
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ESCALA 0–200
            </span>
            <span className="text-xs font-mono text-zinc-400">SENSIBILIDAD POR ARMA & HARDWARE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            CALCULADORA DE SENSIBILIDAD (ESCALA 0–200)
          </h2>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-reset-sensi"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Restablecer a valores recomendados"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">RESTABLECER</span>
          </button>

          <button
            id="btn-load-sensi-modal"
            onClick={() => {
              gamerAudio.playClick();
              setShowSavedModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Cargar configuraciones guardadas"
          >
            <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
            <span>CARGAR ({savedProfiles.length})</span>
          </button>

          <button
            id="btn-copy-sensi"
            onClick={copyConfigSummary}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(255,30,39,0.5)] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡COPIADO!' : 'COPIAR AJUSTES'}</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar: iPhone Model & Screen Protector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
        {/* Model Selection Dropdown */}
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <Smartphone className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="font-bold">MODELO IPHONE:</span>
          </div>
          <select
            value={selectedModel}
            onChange={e => handleModelChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-white text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 max-w-[220px]"
          >
            {IPHONE_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Screen Protector Type */}
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-bold">TIPO DE MICA:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['cristal', 'mate', 'ninguno'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleProtectorChange(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition cursor-pointer ${
                  screenProtector === type
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                {type === 'cristal' ? 'Cristal 9D' : type === 'mate' ? 'Mate Cerámica' : 'Sin Mica'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weapon Presets Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-1">
        {WEAPON_PRESETS.map(w => (
          <button
            key={w.id}
            onClick={() => handleWeaponChange(w.id)}
            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
              selectedWeapon === w.id
                ? 'bg-red-950/50 border-red-500 text-white shadow-md shadow-red-950/60'
                : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="truncate">
              <div className="flex items-center gap-1 text-xs font-bold text-white">
                <span>{w.icon}</span>
                <span className="truncate">{w.name.split(' ')[0]}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block truncate">
                {w.category.toUpperCase()}
              </span>
            </div>
            {selectedWeapon === w.id && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* Sliders Grid & HUD Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-2">
        {/* Sliders Container (2 cols) */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
            <span className="text-white font-bold flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-red-500" />
              CONTROLES DE SENSIBILIDAD (ESCALA 0–200)
            </span>
            <span className="text-emerald-400 font-bold">{activeWeapon.name.split(' ')[0]} • ESCALA 0–200</span>
          </div>

          {/* Slider 1: General */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300 font-bold">GENERAL (CÁMARA / MOVIMIENTO)</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-black text-xs">
                  {customGeneral} / 200
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomGeneral(clamp200(customGeneral - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0"
                max="200"
                value={customGeneral}
                onChange={e => setCustomGeneral(clamp200(+e.target.value))}
                className="flex-1 accent-red-500 h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setCustomGeneral(clamp200(customGeneral + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="200"
                value={customGeneral}
                onChange={e => setCustomGeneral(clamp200(+e.target.value))}
                className="w-14 bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white rounded-lg py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Slider 2: Punto Rojo */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300 font-bold">MIRA DE PUNTO ROJO</span>
              <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-black text-xs">
                {customRedDot} / 200
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomRedDot(clamp200(customRedDot - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0"
                max="200"
                value={customRedDot}
                onChange={e => setCustomRedDot(clamp200(+e.target.value))}
                className="flex-1 accent-red-500 h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setCustomRedDot(clamp200(customRedDot + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="200"
                value={customRedDot}
                onChange={e => setCustomRedDot(clamp200(+e.target.value))}
                className="w-14 bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white rounded-lg py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Slider 3: Mira 2X */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300 font-bold">MIRA 2X</span>
              <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-black text-xs">
                {customScope2x} / 200
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomScope2x(clamp200(customScope2x - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0"
                max="200"
                value={customScope2x}
                onChange={e => setCustomScope2x(clamp200(+e.target.value))}
                className="flex-1 accent-red-500 h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setCustomScope2x(clamp200(customScope2x + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="200"
                value={customScope2x}
                onChange={e => setCustomScope2x(clamp200(+e.target.value))}
                className="w-14 bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white rounded-lg py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Slider 4: Mira 4X */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300 font-bold">MIRA 4X</span>
              <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-black text-xs">
                {customScope4x} / 200
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomScope4x(clamp200(customScope4x - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0"
                max="200"
                value={customScope4x}
                onChange={e => setCustomScope4x(clamp200(+e.target.value))}
                className="flex-1 accent-red-500 h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setCustomScope4x(clamp200(customScope4x + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="200"
                value={customScope4x}
                onChange={e => setCustomScope4x(clamp200(+e.target.value))}
                className="w-14 bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white rounded-lg py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Slider 5: Francotirador */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300 font-bold">MIRA DE FRANCOTIRADOR (AWM / M82B)</span>
              <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-black text-xs">
                {customSniper} / 200
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomSniper(clamp200(customSniper - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0"
                max="200"
                value={customSniper}
                onChange={e => setCustomSniper(clamp200(+e.target.value))}
                className="flex-1 accent-red-500 h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setCustomSniper(clamp200(customSniper + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="200"
                value={customSniper}
                onChange={e => setCustomSniper(clamp200(+e.target.value))}
                className="w-14 bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white rounded-lg py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Slider 6: Cámara / Free Look */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300 font-bold">CÁMARA / FREE LOOK (VISIÓN LIBRE 360°)</span>
              <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-black text-xs">
                {customFreeLook} / 200
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomFreeLook(clamp200(customFreeLook - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="0"
                max="200"
                value={customFreeLook}
                onChange={e => setCustomFreeLook(clamp200(+e.target.value))}
                className="flex-1 accent-red-500 h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setCustomFreeLook(clamp200(customFreeLook + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max="200"
                value={customFreeLook}
                onChange={e => setCustomFreeLook(clamp200(+e.target.value))}
                className="w-14 bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white rounded-lg py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Fire Button, Quick Save & Lift Technique Card (1 col) */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-red-500" />
                BOTÓN DE DISPARO ÓPTIMO
              </span>
              <span className="text-zinc-400 font-mono text-[10px]">{customFireButton}%</span>
            </div>

            {/* Fire button visual preview */}
            <div className="my-2 py-2 flex flex-col items-center justify-center bg-zinc-950/80 rounded-xl border border-zinc-800/80 relative">
              <div
                className="rounded-full border-2 border-dashed border-red-500 flex items-center justify-center bg-red-600/20 text-white font-mono font-bold transition-all shadow-[0_0_15px_rgba(255,30,39,0.3)]"
                style={{
                  width: `${customFireButton * 1.5}px`,
                  height: `${customFireButton * 1.5}px`,
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
              </div>
              <span className="text-xs font-mono text-zinc-300 mt-1 font-bold">
                TAMAÑO: {customFireButton}%
              </span>
            </div>

            {/* Slider for fire button */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Ajustar tamaño:</span>
                <span className="text-white font-bold">{customFireButton}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="75"
                value={customFireButton}
                onChange={e => setCustomFireButton(+e.target.value)}
                className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Save Profile Input */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[11px] font-mono text-zinc-300 font-bold flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-red-500" />
              GUARDAR ESTA CONFIGURACIÓN:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={profileNameInput}
                onChange={e => setProfileNameInput(e.target.value)}
                placeholder={`Ej. Mi Sensi ${activeWeapon.name.split(' ')[0]}`}
                className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500"
              />
              <button
                id="btn-save-profile"
                onClick={handleSaveProfile}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>GUARDAR</span>
              </button>
            </div>
          </div>

          {/* Technique Description */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <span className="text-red-400 font-bold block mb-0.5">TÉCNICA DE TIRO RECOMENDADA:</span>
            <span>{activeWeapon.liftTechnique}</span>
          </div>
        </div>
      </div>

      {/* Fair Play & Notes Banner */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>100% Fair Play & Escala 0–200:</strong> Ajustes calibrados para la escala oficial de 0 a 200 en pantallas iPhone OLED de 120Hz con muestreo a 240Hz.
          </span>
        </div>
      </div>

      {/* Saved Profiles Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sm text-white font-mono">CONFIGURACIONES GUARDADAS (ESCALA 0–200)</h3>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 font-mono text-xs cursor-pointer"
              >
                ✕ CERRAR
              </button>
            </div>

            {savedProfiles.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-zinc-500">
                No tienes perfiles guardados. Ajusta tus valores en la escala 0–200 y presiona "GUARDAR".
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {savedProfiles.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleLoadProfile(p)}
                    className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-red-500/60 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-red-400 font-mono">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        Gen: <strong className="text-red-300">{p.general}</strong> • Punto: <strong className="text-red-300">{p.redDot}</strong> • 2X: <strong className="text-red-300">{p.scope2x}</strong> • 4X: <strong className="text-red-300">{p.scope4x}</strong> • AWM: <strong className="text-red-300">{p.sniperScope}</strong> • Libre: <strong className="text-red-300">{p.freeLook}</strong>
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
                        {p.targetDevice} • Guardado el {p.savedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-red-400 font-bold group-hover:underline">
                        CARGAR →
                      </span>
                      <button
                        onClick={(e) => handleDeleteProfile(p.id, e)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer"
                        title="Eliminar perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

