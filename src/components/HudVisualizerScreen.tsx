import React, { useState, useRef } from 'react';
import { Crosshair, Shield, Eye, Move, Sliders, Check, Copy, Sparkles, Smartphone, Layers, Maximize2 } from 'lucide-react';
import { gamerAudio } from '../utils/audio';

interface HudElement {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
  sizePercent: number;
  opacityPercent: number;
  color: string;
}

const DEFAULT_HUD_ELEMENTS: HudElement[] = [
  { id: 'fire', name: 'Botón de Disparo', xPercent: 82, yPercent: 72, sizePercent: 44, opacityPercent: 90, color: '#ef4444' },
  { id: 'gloo', name: 'Pared Gloo', xPercent: 18, yPercent: 68, sizePercent: 55, opacityPercent: 85, color: '#3b82f6' },
  { id: 'jump', name: 'Salto', xPercent: 88, yPercent: 48, sizePercent: 48, opacityPercent: 80, color: '#eab308' },
  { id: 'crouch', name: 'Agacharse', xPercent: 78, yPercent: 52, sizePercent: 46, opacityPercent: 80, color: '#10b981' },
  { id: 'scope', name: 'Mira (Apuntar)', xPercent: 86, yPercent: 28, sizePercent: 50, opacityPercent: 85, color: '#a855f7' },
  { id: 'joystick', name: 'Joystick / Analógico', xPercent: 16, yPercent: 74, sizePercent: 40, opacityPercent: 70, color: '#71717a' },
];

export const HudVisualizerScreen: React.FC = () => {
  const [elements, setElements] = useState<HudElement[]>(DEFAULT_HUD_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string>('fire');
  const [copied, setCopied] = useState(false);
  const [fingersSetup, setFingersSetup] = useState<'2-dedos' | '3-dedos' | '4-dedos'>('3-dedos');
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedElement = elements.find(e => e.id === selectedId) || elements[0];

  const handleUpdateSelected = (key: keyof HudElement, val: number) => {
    setElements(prev =>
      prev.map(e => (e.id === selectedId ? { ...e, [key]: val } : e))
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(5, Math.min(95, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    gamerAudio.playClick();
    setElements(prev =>
      prev.map(item => (item.id === selectedId ? { ...item, xPercent: x, yPercent: y } : item))
    );
  };

  const handlePresetSetup = (mode: '2-dedos' | '3-dedos' | '4-dedos') => {
    gamerAudio.playSelect();
    setFingersSetup(mode);

    if (mode === '2-dedos') {
      setElements([
        { id: 'fire', name: 'Botón de Disparo', xPercent: 82, yPercent: 72, sizePercent: 46, opacityPercent: 90, color: '#ef4444' },
        { id: 'gloo', name: 'Pared Gloo', xPercent: 22, yPercent: 70, sizePercent: 52, opacityPercent: 85, color: '#3b82f6' },
        { id: 'jump', name: 'Salto', xPercent: 88, yPercent: 50, sizePercent: 48, opacityPercent: 80, color: '#eab308' },
        { id: 'crouch', name: 'Agacharse', xPercent: 78, yPercent: 55, sizePercent: 46, opacityPercent: 80, color: '#10b981' },
        { id: 'scope', name: 'Mira (Apuntar)', xPercent: 86, yPercent: 32, sizePercent: 50, opacityPercent: 85, color: '#a855f7' },
        { id: 'joystick', name: 'Joystick / Analógico', xPercent: 16, yPercent: 74, sizePercent: 40, opacityPercent: 70, color: '#71717a' },
      ]);
    } else if (mode === '3-dedos') {
      setElements([
        { id: 'fire', name: 'Botón de Disparo', xPercent: 82, yPercent: 72, sizePercent: 42, opacityPercent: 90, color: '#ef4444' },
        { id: 'gloo', name: 'Pared Gloo', xPercent: 18, yPercent: 26, sizePercent: 58, opacityPercent: 90, color: '#3b82f6' },
        { id: 'jump', name: 'Salto', xPercent: 88, yPercent: 48, sizePercent: 48, opacityPercent: 80, color: '#eab308' },
        { id: 'crouch', name: 'Agacharse', xPercent: 78, yPercent: 52, sizePercent: 46, opacityPercent: 80, color: '#10b981' },
        { id: 'scope', name: 'Mira (Apuntar)', xPercent: 86, yPercent: 26, sizePercent: 50, opacityPercent: 85, color: '#a855f7' },
        { id: 'joystick', name: 'Joystick / Analógico', xPercent: 16, yPercent: 74, sizePercent: 36, opacityPercent: 70, color: '#71717a' },
      ]);
    } else {
      // 4-dedos (Pro claw)
      setElements([
        { id: 'fire', name: 'Botón de Disparo', xPercent: 82, yPercent: 72, sizePercent: 40, opacityPercent: 90, color: '#ef4444' },
        { id: 'gloo', name: 'Pared Gloo', xPercent: 16, yPercent: 22, sizePercent: 60, opacityPercent: 90, color: '#3b82f6' },
        { id: 'jump', name: 'Salto', xPercent: 84, yPercent: 20, sizePercent: 52, opacityPercent: 85, color: '#eab308' },
        { id: 'crouch', name: 'Agacharse', xPercent: 78, yPercent: 52, sizePercent: 46, opacityPercent: 80, color: '#10b981' },
        { id: 'scope', name: 'Mira (Apuntar)', xPercent: 88, yPercent: 45, sizePercent: 50, opacityPercent: 85, color: '#a855f7' },
        { id: 'joystick', name: 'Joystick / Analógico', xPercent: 16, yPercent: 74, sizePercent: 35, opacityPercent: 70, color: '#71717a' },
      ]);
    }
  };

  const copyHudSummary = () => {
    gamerAudio.playClick();
    const summary = elements
      .map(e => `${e.name}: Posición X=${e.xPercent}%, Y=${e.yPercent}%, Tamaño=${e.sizePercent}%, Opacidad=${e.opacityPercent}%`)
      .join('\n');
    const text = `🎯 SENSI 33 - RECOMENDACIÓN DE HUD PERSONALIZADO (${fingersSetup.toUpperCase()}):\n${summary}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              CONFIGURACIÓN DE HUD
            </span>
            <span className="text-xs font-mono text-zinc-400">SIMULADOR & COORDENADAS TÁCTILES</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            DISTRIBUCIÓN DE BOTONES & CUSTOM HUD
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {(['2-dedos', '3-dedos', '4-dedos'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => handlePresetSetup(mode)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                  fingersSetup === mode
                    ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(255,30,39,0.5)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            id="btn-copy-hud"
            onClick={copyHudSummary}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(255,30,39,0.5)] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡COPIADO!' : 'COPIAR HUD'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: HUD Interactive Screen Canvas & Inspector Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-3 flex-1">
        {/* Interactive Simulated Screen (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
            <span className="text-white font-bold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-red-500" />
              CANVAS SIMULADO DE IPHONE (Toca para reubicar elemento seleccionado)
            </span>
            <span className="text-red-400 font-bold">Elemento: {selectedElement.name}</span>
          </div>

          {/* Game Canvas Container (Aspect 16:9) */}
          <div
            ref={canvasContainerRef}
            onClick={handleCanvasClick}
            className="relative my-3 w-full h-56 sm:h-64 rounded-xl border border-zinc-700 bg-[radial-gradient(ellipse_at_center,#171822_0%,#09090d_100%)] overflow-hidden cursor-crosshair shadow-inner"
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Simulated Crosshair in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <Crosshair className="w-8 h-8 text-zinc-400" />
            </div>

            {/* Render HUD Elements */}
            {elements.map(el => {
              const isSelected = el.id === selectedId;
              const pxSize = Math.max(32, Math.round(el.sizePercent * 0.9));
              return (
                <div
                  key={el.id}
                  onClick={e => {
                    e.stopPropagation();
                    gamerAudio.playSelect();
                    setSelectedId(el.id);
                  }}
                  style={{
                    left: `${el.xPercent}%`,
                    top: `${el.yPercent}%`,
                    width: `${pxSize}px`,
                    height: `${pxSize}px`,
                    opacity: el.opacityPercent / 100,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center font-mono font-bold text-[9px] transition-transform cursor-pointer select-none ${
                    isSelected
                      ? 'border-2 border-white ring-2 ring-red-500 shadow-[0_0_15px_#ff1e27] scale-110'
                      : 'border border-zinc-400/60'
                  }`}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${el.color}35`, border: `1.5px solid ${el.color}` }}
                  >
                    <span className="text-white text-center leading-tight truncate px-1 drop-shadow">
                      {el.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick HUD Bar Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {elements.map(e => (
              <button
                key={e.id}
                onClick={() => {
                  gamerAudio.playClick();
                  setSelectedId(e.id);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                  selectedId === e.id
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inspector & Sliders Sidebar (1 Col) */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-500" />
                CALIBRACIÓN DE {selectedElement.name.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3.5 mt-3">
              {/* Size Slider */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-zinc-300">
                  <span>Tamaño de Botón:</span>
                  <span className="text-red-400 font-bold">{selectedElement.sizePercent}%</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="80"
                  value={selectedElement.sizePercent}
                  onChange={e => handleUpdateSelected('sizePercent', +e.target.value)}
                  className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-zinc-300">
                  <span>Opacidad / Transparencia:</span>
                  <span className="text-red-400 font-bold">{selectedElement.opacityPercent}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={selectedElement.opacityPercent}
                  onChange={e => handleUpdateSelected('opacityPercent', +e.target.value)}
                  className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pos X */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-zinc-300">
                  <span>Posición Horizontal (X):</span>
                  <span className="text-white font-bold">{selectedElement.xPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={selectedElement.xPercent}
                  onChange={e => handleUpdateSelected('xPercent', +e.target.value)}
                  className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pos Y */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-zinc-300">
                  <span>Posición Vertical (Y):</span>
                  <span className="text-white font-bold">{selectedElement.yPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={selectedElement.yPercent}
                  onChange={e => handleUpdateSelected('yPercent', +e.target.value)}
                  className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <span className="text-red-400 font-bold block mb-0.5">RECOMENDACIÓN COMPETITIVA:</span>
            <span>Para 3 y 4 dedos, coloca la <strong>Pared Gloo arriba a la izquierda</strong> para activarla con el dedo índice y ganar milisegundos en PvP.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
