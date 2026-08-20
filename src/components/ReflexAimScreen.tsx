import React, { useState, useRef, useEffect } from 'react';
import { Target, Zap, Timer, Award, RotateCcw, Crosshair, Sparkles, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { gamerAudio } from '../utils/audio';
import { DragTestResult } from '../types';

export const ReflexAimScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'drag' | 'reflex'>('drag');

  // Drag / Swipe Test States
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStartPos, setSwipeStartPos] = useState<{ x: number; y: number; time: number } | null>(null);
  const [dragResult, setDragResult] = useState<DragTestResult | null>(null);
  const [swipeHistory, setSwipeHistory] = useState<DragTestResult[]>([]);

  // Reflex Reaction Test States
  const [reflexState, setReflexState] = useState<'idle' | 'waiting' | 'ready' | 'clicked' | 'early'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [reactionHistory, setReactionHistory] = useState<number[]>([]);
  const timeoutRef = useRef<any>(null);
  const readyTimeRef = useRef<number>(0);

  // Drag Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsSwiping(true);
    setSwipeStartPos({
      x: clientX,
      y: clientY,
      time: performance.now(),
    });
    gamerAudio.playClick();
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping || !swipeStartPos) return;
    setIsSwiping(false);

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const endTime = performance.now();

    const dx = clientX - swipeStartPos.x;
    const dy = swipeStartPos.y - clientY; // Upwards is positive
    const distance = Math.hypot(dx, dy);
    const duration = Math.max(1, Math.round(endTime - swipeStartPos.time));

    // Calculate swipe velocity in pixels/ms
    const speedRatio = distance / duration;
    gamerAudio.playSwipeFlick(speedRatio);

    const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

    let grade: 'S+' | 'A' | 'B' | 'C' = 'B';
    let velocityScore = Math.min(100, Math.round((speedRatio / 1.8) * 100));
    let advice = '';

    if (dy < 20) {
      grade = 'C';
      advice = 'Levantamiento insuficiente: Debes deslizar tu dedo hacia arriba con mayor decisión.';
    } else if (duration < 90) {
      grade = 'S+';
      advice = '¡Velocidad Relámpago! Excelente para escopetas a corta distancia. Te sugerimos General en 188-196 / 200 para no sobrepasar la cabeza.';
    } else if (duration <= 160) {
      grade = 'A';
      advice = 'Velocidad Óptima Pro: Gran control y consistencia para SMG y Rifles de Asalto a media distancia.';
    } else {
      grade = 'B';
      advice = 'Gesto algo pausado: Aumenta la velocidad de cursor en AssistiveTouch o sube tu sensibilidad General a 192-200 / 200.';
    }

    const res: DragTestResult = {
      swipeSpeedMs: duration,
      distancePx: Math.round(distance),
      liftAngleDeg: angle,
      velocityScore,
      accuracyGrade: grade,
      advice,
    };

    setDragResult(res);
    setSwipeHistory(prev => [res, ...prev.slice(0, 4)]);
  };

  // Reflex Reaction Start
  const startReflexTest = () => {
    gamerAudio.playClick();
    setReflexState('waiting');
    setReactionTime(null);

    const randomDelay = Math.floor(Math.random() * 2500) + 1500; // 1.5s to 4s
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      readyTimeRef.current = performance.now();
      setReflexState('ready');
      gamerAudio.playPingRadar();
    }, randomDelay);
  };

  const handleReflexClick = () => {
    if (reflexState === 'waiting') {
      // Clicked too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setReflexState('early');
      gamerAudio.playClick();
    } else if (reflexState === 'ready') {
      const delta = Math.round(performance.now() - readyTimeRef.current);
      setReactionTime(delta);
      setReflexState('clicked');
      gamerAudio.playHeadshotTone();
      setReactionHistory(prev => [delta, ...prev.slice(0, 4)]);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              ENTRENAMIENTO TÁCTIL
            </span>
            <span className="text-xs font-mono text-zinc-400">CALIBRADOR DE REFLEJOS & FLICK</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            TEST DE LEVANTAMIENTO DE MIRA & TIEMPO DE RESPUESTA
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            id="tab-drag-test"
            onClick={() => {
              gamerAudio.playSelect();
              setActiveTab('drag');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'drag' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.5)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>LEVANTAMIENTO (FLICK)</span>
          </button>

          <button
            id="tab-reflex-test"
            onClick={() => {
              gamerAudio.playSelect();
              setActiveTab('reflex');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'reflex' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.5)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>REFLEJOS (REACCIÓN)</span>
          </button>
        </div>
      </div>

      {/* Main Mode Body */}
      {activeTab === 'drag' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-3 flex-1">
          {/* Interactive Swipe Area (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-red-500" />
                ZONA DE CALIBRACIÓN DE TIRO EN JOTA / FLICK
              </span>
              <span className="text-zinc-400 text-[11px]">Toca y desliza hacia arriba rápido</span>
            </div>

            {/* Gesture Canvas Container */}
            <div
              id="swipe-gesture-box"
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`relative my-3 h-48 sm:h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                isSwiping
                  ? 'border-red-500 bg-red-950/30 shadow-[0_0_25px_rgba(255,30,39,0.3)]'
                  : 'border-zinc-700/80 bg-zinc-950/70 hover:border-zinc-600'
              }`}
            >
              {/* Target Crosshair Graphic */}
              <div className="w-16 h-16 rounded-full border-2 border-red-500/40 flex items-center justify-center relative mb-2">
                <div className="w-8 h-8 rounded-full border border-red-400/60 animate-ping absolute" />
                <Crosshair className="w-8 h-8 text-red-500" />
              </div>

              <span className="text-sm font-bold text-zinc-200 tracking-wide font-mono">
                {isSwiping ? '¡SUELTA ARRIBA AHORA!' : 'DESLIZA EL DEDO HACIA ARRIBA RÁPIDAMENTE'}
              </span>
              <span className="text-xs text-zinc-500 font-mono mt-1">
                Simula tu levantamiento de mira habitual para evaluar velocidad y trayectoria
              </span>
            </div>

            {/* Drag Metric Cards */}
            {dragResult && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/50 flex flex-col items-center justify-center font-black text-xl text-red-400">
                    {dragResult.accuracyGrade}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-white font-bold">DURACIÓN DEL GESTO: {dragResult.swipeSpeedMs}ms</span>
                      <span className="text-zinc-400">| Distancia: {dragResult.distancePx}px</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">{dragResult.advice}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drag Feedback & Stats Sidebar (1 Col) */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-red-500" />
                  ÚLTIMOS INTENTOS
                </span>
                <span className="text-zinc-400 text-[10px]">TÁCTIL 240Hz</span>
              </div>

              <div className="space-y-2 mt-3">
                {swipeHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-zinc-500">
                    Realiza tu primer levantamiento en la zona izquierda para ver estadísticas.
                  </div>
                ) : (
                  swipeHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-red-600/20 text-red-400 font-bold flex items-center justify-center">
                          {item.accuracyGrade}
                        </span>
                        <span className="text-zinc-300">{item.swipeSpeedMs} ms</span>
                      </div>
                      <span className="text-zinc-500">{item.distancePx} px</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <span className="text-emerald-400 font-bold block mb-0.5">ESTÁNDAR PRO GAMING:</span>
              <span>Un levantamiento óptimo toma entre <strong>95ms y 140ms</strong> en pantallas OLED de 120Hz.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Reflex Reaction Area */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-3 flex-1">
          {/* Reaction Interactive Box (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-red-500" />
                TEST DE REFLEJOS & HEADSHOT REACTION
              </span>
              <span className="text-zinc-400 text-[11px]">Medición en milisegundos</span>
            </div>

            {/* Reaction State Canvas */}
            <div
              id="reflex-target-box"
              onClick={
                reflexState === 'idle'
                  ? startReflexTest
                  : reflexState === 'waiting'
                  ? handleReflexClick
                  : reflexState === 'ready'
                  ? handleReflexClick
                  : startReflexTest
              }
              className={`relative my-3 h-52 sm:h-60 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
                reflexState === 'idle'
                  ? 'border-zinc-700 bg-zinc-950/80 hover:border-red-500/50'
                  : reflexState === 'waiting'
                  ? 'border-yellow-500/60 bg-yellow-950/30'
                  : reflexState === 'ready'
                  ? 'border-emerald-400 bg-emerald-950/50 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                  : reflexState === 'early'
                  ? 'border-red-600 bg-red-950/40'
                  : 'border-blue-500/60 bg-blue-950/30'
              }`}
            >
              {reflexState === 'idle' && (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center mx-auto">
                    <Target className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="text-sm font-bold font-mono text-white">TOCA PARA INICIAR TEST DE REFLEJOS</div>
                  <div className="text-xs text-zinc-500 font-mono">Espera a que el recuadro cambie a VERDE y toca al instante</div>
                </div>
              )}

              {reflexState === 'waiting' && (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin mx-auto" />
                  <div className="text-sm font-bold font-mono text-yellow-300">PREPÁRATE... ESPERA EL COLOR VERDE</div>
                  <div className="text-xs text-zinc-500 font-mono">No toques antes de tiempo</div>
                </div>
              )}

              {reflexState === 'ready' && (
                <div className="text-center space-y-2 animate-bounce">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_25px_#10b981]">
                    <Zap className="w-9 h-9 text-black fill-black" />
                  </div>
                  <div className="text-lg font-black font-mono text-white tracking-widest">¡¡TOCA YA!!</div>
                </div>
              )}

              {reflexState === 'early' && (
                <div className="text-center space-y-2">
                  <div className="text-lg font-bold font-mono text-red-400">¡DEMASIADO PRONTO!</div>
                  <div className="text-xs text-zinc-400 font-mono">Tocaste antes del color verde. Toca para reintentar.</div>
                </div>
              )}

              {reflexState === 'clicked' && reactionTime && (
                <div className="text-center space-y-1">
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">TIEMPO DE REACCIÓN</span>
                  <div className="text-4xl sm:text-5xl font-black italic tracking-tight text-white">
                    {reactionTime} <span className="text-lg font-mono text-zinc-400">ms</span>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono mt-1">
                    {reactionTime < 180 ? '⚡️ Nivel Esports / Reacción Humana Máxima' : reactionTime < 240 ? '🎯 Excelente respuesta táctil' : '👍 Reacción promedio'}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block pt-1">Toca para probar de nuevo</span>
                </div>
              )}
            </div>
          </div>

          {/* Reaction Stats Sidebar (1 Col) */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-zinc-800">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-red-500" />
                  HISTORIAL DE REACCIÓN
                </span>
                <span className="text-zinc-400 text-[10px]">MS</span>
              </div>

              <div className="space-y-2 mt-3">
                {reactionHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-zinc-500">
                    Inicia el test de reflejos para registrar tus tiempos de respuesta.
                  </div>
                ) : (
                  reactionHistory.map((time, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-zinc-400">Intento #{reactionHistory.length - idx}</span>
                      <span className={`font-bold ${time < 200 ? 'text-emerald-400' : time < 250 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                        {time} ms
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <span className="text-red-400 font-bold block mb-0.5">BENEFICIO DEL TEST:</span>
              <span>Entrena tu coordinación ojo-mano para disparar primero al ver asomar al enemigo.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
