import React, { useState, useEffect } from 'react';
import {
  DeviceInfo,
  ScreenId,
  TrainingModuleId,
  TrainingDifficulty,
  TrainingRoutineId,
  TrainingRoutineConfig,
  TrainingSessionRecord,
  TrainingRecordsSummary,
} from '../types';
import {
  DIFFICULTY_CONFIGS,
  ROUTINES_CONFIG,
  TRAINING_MODULE_META,
  getSavedTrainingSessions,
  getSavedTrainingRecords,
  saveTrainingSession,
  getRankColor,
} from '../utils/trainingEngine';
import { gamerAudio } from '../utils/audio';
import { TrainingFlickArena } from './training/TrainingFlickArena';
import { TrainingReactionArena } from './training/TrainingReactionArena';
import { TrainingPrecisionArena } from './training/TrainingPrecisionArena';
import { TrainingConsistencyArena } from './training/TrainingConsistencyArena';
import { TrainingResultView } from './training/TrainingResultView';
import { TrainingRecordsAndEvolutionView } from './training/TrainingRecordsAndEvolutionView';
import {
  Crosshair,
  Zap,
  Target,
  Brain,
  Play,
  Flame,
  Clock,
  Trophy,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  BarChart2,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface TrainingScreenProps {
  deviceInfo: DeviceInfo;
  onNavigate?: (screen: ScreenId) => void;
}

type ActiveView = 'hub' | 'arena' | 'result' | 'records_evolution';

export function TrainingScreen({ deviceInfo, onNavigate }: TrainingScreenProps) {
  // Navigation & Active Training State
  const [activeView, setActiveView] = useState<ActiveView>('hub');
  const [activeTab, setActiveTab] = useState<'modules' | 'routines' | 'records'>('modules');
  const [selectedDifficulty, setSelectedDifficulty] = useState<TrainingDifficulty>('normal');
  const [activeModule, setActiveModule] = useState<TrainingModuleId>('flick');

  // Routine execution state
  const [activeRoutine, setActiveRoutine] = useState<TrainingRoutineConfig | null>(null);
  const [currentRoutineStepIdx, setCurrentRoutineStepIdx] = useState<number>(0);

  // Results State
  const [lastResultRecord, setLastResultRecord] = useState<TrainingSessionRecord | null>(null);

  // Local Storage Data
  const [sessions, setSessions] = useState<TrainingSessionRecord[]>([]);
  const [recordsSummary, setRecordsSummary] = useState<TrainingRecordsSummary>({
    bestFlickScore: 0,
    bestFlickTimeMs: 0,
    bestReactionMs: 0,
    bestPrecisionPercent: 0,
    bestConsistencyScore: 0,
    bestGlobalScore: 0,
    totalTrainingSessions: 0,
    lastUpdated: new Date().toISOString(),
  });

  useEffect(() => {
    loadLocalTrainingData();
  }, []);

  const loadLocalTrainingData = () => {
    const s = getSavedTrainingSessions();
    const r = getSavedTrainingRecords();
    setSessions(s);
    setRecordsSummary(r);
  };

  // Start single module
  const handleStartModule = (moduleId: TrainingModuleId) => {
    gamerAudio.playSelect();
    setActiveModule(moduleId);
    setActiveRoutine(null);
    setCurrentRoutineStepIdx(0);
    setActiveView('arena');
  };

  // Start preconfigured routine
  const handleStartRoutine = (routineId: TrainingRoutineId) => {
    gamerAudio.playSelect();
    const routine = ROUTINES_CONFIG[routineId];
    if (!routine || routine.modules.length === 0) return;

    setActiveRoutine(routine);
    setCurrentRoutineStepIdx(0);
    const firstStep = routine.modules[0];
    setActiveModule(firstStep.moduleId);
    setSelectedDifficulty(firstStep.difficulty);
    setActiveView('arena');
  };

  // Complete an arena session
  const handleArenaComplete = (record: TrainingSessionRecord) => {
    // Automatically save session to history
    saveTrainingSession(record);
    loadLocalTrainingData();

    setLastResultRecord(record);
    setActiveView('result');

    if (record.score >= 88) {
      gamerAudio.playVictoryFanfare();
    }
  };

  // Proceed to next step in active routine
  const handleNextRoutineStep = () => {
    if (!activeRoutine) return;
    const nextIdx = currentRoutineStepIdx + 1;
    if (nextIdx < activeRoutine.modules.length) {
      setCurrentRoutineStepIdx(nextIdx);
      const nextStep = activeRoutine.modules[nextIdx];
      setActiveModule(nextStep.moduleId);
      setSelectedDifficulty(nextStep.difficulty);
      setActiveView('arena');
    } else {
      // Routine finished
      setActiveRoutine(null);
      setActiveView('hub');
    }
  };

  // Get last result for a given module
  const getLastModuleResult = (mod: TrainingModuleId) => {
    return sessions.find(s => s.module === mod);
  };

  // Get best result for a given module
  const getBestModuleScore = (mod: TrainingModuleId) => {
    const matching = sessions.filter(s => s.module === mod);
    if (matching.length === 0) return 0;
    return Math.max(...matching.map(s => s.score));
  };

  return (
    <div
      id="training-screen-root"
      className="relative w-full h-full bg-[#07070a] text-zinc-100 flex flex-col justify-between overflow-hidden select-none p-3 sm:p-5"
    >
      {/* Background Ambience */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* VIEW: 1. ARENA */}
      {activeView === 'arena' && (
        <div className="w-full h-full">
          {activeModule === 'flick' && (
            <TrainingFlickArena
              difficulty={selectedDifficulty}
              totalTargets={10}
              routineContext={activeRoutine ? {
                routineId: activeRoutine.id,
                step: currentRoutineStepIdx + 1,
                totalSteps: activeRoutine.modules.length,
                title: activeRoutine.modules[currentRoutineStepIdx].title,
              } : undefined}
              onComplete={handleArenaComplete}
              onCancel={() => setActiveView('hub')}
            />
          )}

          {activeModule === 'reaction' && (
            <TrainingReactionArena
              difficulty={selectedDifficulty}
              totalRounds={10}
              routineContext={activeRoutine ? {
                routineId: activeRoutine.id,
                step: currentRoutineStepIdx + 1,
                totalSteps: activeRoutine.modules.length,
                title: activeRoutine.modules[currentRoutineStepIdx].title,
              } : undefined}
              onComplete={handleArenaComplete}
              onCancel={() => setActiveView('hub')}
            />
          )}

          {activeModule === 'precision' && (
            <TrainingPrecisionArena
              difficulty={selectedDifficulty}
              totalTargets={10}
              routineContext={activeRoutine ? {
                routineId: activeRoutine.id,
                step: currentRoutineStepIdx + 1,
                totalSteps: activeRoutine.modules.length,
                title: activeRoutine.modules[currentRoutineStepIdx].title,
              } : undefined}
              onComplete={handleArenaComplete}
              onCancel={() => setActiveView('hub')}
            />
          )}

          {activeModule === 'consistency' && (
            <TrainingConsistencyArena
              difficulty={selectedDifficulty}
              totalAttempts={12}
              routineContext={activeRoutine ? {
                routineId: activeRoutine.id,
                step: currentRoutineStepIdx + 1,
                totalSteps: activeRoutine.modules.length,
                title: activeRoutine.modules[currentRoutineStepIdx].title,
              } : undefined}
              onComplete={handleArenaComplete}
              onCancel={() => setActiveView('hub')}
            />
          )}
        </div>
      )}

      {/* VIEW: 2. RESULTADOS */}
      {activeView === 'result' && lastResultRecord && (
        <TrainingResultView
          record={lastResultRecord}
          isRoutineStep={!!activeRoutine}
          hasNextRoutineStep={!!activeRoutine && currentRoutineStepIdx + 1 < activeRoutine.modules.length}
          onRepeat={() => setActiveView('arena')}
          onNextRoutineStep={handleNextRoutineStep}
          onReturnToHub={() => setActiveView('hub')}
          onNavigate={onNavigate}
        />
      )}

      {/* VIEW: 3. MAIN HUB & RECORDS */}
      {activeView === 'hub' && (
        <div className="w-full h-full flex flex-col justify-between overflow-y-auto space-y-3">
          {/* Header Strip with Title & Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/40 shadow-[0_0_12px_rgba(255,30,39,0.3)]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-mono font-black text-white tracking-wider flex items-center gap-2">
                    CENTRO DE ENTRENAMIENTO
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/40">
                    SENSI 33
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400">
                  Práctica táctica interna de Reacción, Flick, Precisión y Consistencia
                </p>
              </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
              <button
                id="tab-training-modules"
                onClick={() => {
                  gamerAudio.playClick();
                  setActiveTab('modules');
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'modules'
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(255,30,39,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>MÓDULOS</span>
              </button>

              <button
                id="tab-training-routines"
                onClick={() => {
                  gamerAudio.playClick();
                  setActiveTab('routines');
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'routines'
                    ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>RUTINAS</span>
              </button>

              <button
                id="tab-training-records"
                onClick={() => {
                  gamerAudio.playClick();
                  setActiveTab('records');
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'records'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>RÉCORDS</span>
              </button>
            </div>
          </div>

          {/* TAB 1: 4 MÓDULOS DE ENTRENAMIENTO */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              {/* Difficulty Selector Bar */}
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase">DIFICULTAD:</span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Modifica tamaño, distancias y tiempo disponible legítimamente
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
                  {(['facil', 'normal', 'dificil', 'extremo'] as TrainingDifficulty[]).map(diff => {
                    const cfg = DIFFICULTY_CONFIGS[diff];
                    const isSelected = selectedDifficulty === diff;

                    return (
                      <button
                        key={diff}
                        id={`btn-diff-${diff}`}
                        onClick={() => {
                          gamerAudio.playClick();
                          setSelectedDifficulty(diff);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition border cursor-pointer text-center ${
                          isSelected
                            ? cfg.badgeColor
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800/60'
                        }`}
                      >
                        {cfg.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. FLICK */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-red-500/30 hover:border-red-500/60 transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
                        <Crosshair className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-mono font-black text-white tracking-wider">
                            🎯 FLICK
                          </h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/30 uppercase">
                            10 Objetivos
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">
                          Levantamiento de mira & desplazamiento rápido hacia objetivos aleatorios.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Results preview */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">MEJOR RESULTADO</span>
                      <strong className="text-amber-400">
                        {getBestModuleScore('flick') > 0 ? `${getBestModuleScore('flick')} pts` : '--'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ÚLTIMO RESULTADO</span>
                      <span className="text-zinc-300">
                        {getLastModuleResult('flick') ? `${getLastModuleResult('flick')?.score} pts (${getLastModuleResult('flick')?.reactionTimeMs}ms)` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    id="btn-start-flick"
                    onClick={() => handleStartModule('flick')}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(255,30,39,0.4)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>INICIAR FLICK ({selectedDifficulty.toUpperCase()})</span>
                  </button>
                </div>

                {/* 2. REACCIÓN */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-yellow-500/30 hover:border-yellow-500/60 transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-mono font-black text-white tracking-wider">
                            ⚡ REACCIÓN
                          </h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-950/60 text-yellow-400 border border-yellow-500/30 uppercase">
                            10 Rondas
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">
                          Tiempo de respuesta ante estímulo visual imprevisto sin anticipación.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Results preview */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">MEJOR REACCIÓN</span>
                      <strong className="text-yellow-400">
                        {recordsSummary.bestReactionMs > 0 ? `${recordsSummary.bestReactionMs} ms` : '--'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ÚLTIMO RESULTADO</span>
                      <span className="text-zinc-300">
                        {getLastModuleResult('reaction') ? `${getLastModuleResult('reaction')?.reactionTimeMs} ms` : '--'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-start-reaction"
                    onClick={() => handleStartModule('reaction')}
                    className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>INICIAR REACCIÓN ({selectedDifficulty.toUpperCase()})</span>
                  </button>
                </div>

                {/* 3. PRECISIÓN */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 hover:border-emerald-500/60 transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-mono font-black text-white tracking-wider">
                            🎯 PRECISIÓN
                          </h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase">
                            10 Dianas
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">
                          Micro-ajuste sobre objetivos de tamaño decreciente bajo cronómetro.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Results preview */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">MEJOR PRECISIÓN</span>
                      <strong className="text-emerald-400">
                        {recordsSummary.bestPrecisionPercent > 0 ? `${recordsSummary.bestPrecisionPercent}%` : '--'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ÚLTIMO RESULTADO</span>
                      <span className="text-zinc-300">
                        {getLastModuleResult('precision') ? `${getLastModuleResult('precision')?.accuracyPercent}% (${getLastModuleResult('precision')?.score} pts)` : '--'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-start-precision"
                    onClick={() => handleStartModule('precision')}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>INICIAR PRECISIÓN ({selectedDifficulty.toUpperCase()})</span>
                  </button>
                </div>

                {/* 4. CONSISTENCIA */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 hover:border-cyan-500/60 transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-mono font-black text-white tracking-wider">
                            🧠 CONSISTENCIA
                          </h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 uppercase">
                            12 Intentos
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">
                          Control de fatiga motora comparando rendimiento entre primera y segunda mitad.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Results preview */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">MEJOR CONSISTENCIA</span>
                      <strong className="text-cyan-400">
                        {recordsSummary.bestConsistencyScore > 0 ? `${recordsSummary.bestConsistencyScore}%` : '--'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ÚLTIMO RESULTADO</span>
                      <span className="text-zinc-300">
                        {getLastModuleResult('consistency') ? `${getLastModuleResult('consistency')?.consistencyScore}%` : '--'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-start-consistency"
                    onClick={() => handleStartModule('consistency')}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>INICIAR CONSISTENCIA ({selectedDifficulty.toUpperCase()})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 3 RUTINAS COMPLETAS */}
          {activeTab === 'routines' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400 mb-1">
                Selecciona una rutina guiada multiejercicio para optimizar tu memoria muscular antes de jugar:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 5 Min Rápida */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-yellow-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">⚡</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                        2 Ejercicios
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-black text-white">5 MIN — RÁPIDA</h3>
                    <p className="text-xs font-mono text-zinc-400 mt-1">
                      Calentamiento exprés enfocado en activar reflejos musculares y velocidad de toque.
                    </p>
                    <div className="mt-3 space-y-1 text-[11px] font-mono text-zinc-500">
                      <div>1. Reacción Refleja (Normal)</div>
                      <div>2. Flick & Levantamiento (Normal)</div>
                    </div>
                  </div>

                  <button
                    id="btn-routine-5min"
                    onClick={() => handleStartRoutine('routine_5min')}
                    className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>INICIAR RUTINA 5 MIN</span>
                  </button>
                </div>

                {/* 10 Min Completa */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-red-500/40 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                    RECOMENDADA
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🎯</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-300 border border-red-500/40">
                        4 Ejercicios
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-black text-white">10 MIN — COMPLETA</h3>
                    <p className="text-xs font-mono text-zinc-400 mt-1">
                      Cubre los cuatro pilares competitivos para duelos clasificados y torneos.
                    </p>
                    <div className="mt-3 space-y-1 text-[11px] font-mono text-zinc-500">
                      <div>1. Reacción • 2. Flick Pro</div>
                      <div>3. Micro-Precisión • 4. Control Fatiga</div>
                    </div>
                  </div>

                  <button
                    id="btn-routine-10min"
                    onClick={() => handleStartRoutine('routine_10min')}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(255,30,39,0.4)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>INICIAR RUTINA 10 MIN</span>
                  </button>
                </div>

                {/* 15 Min Pro */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-orange-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🔥</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        4 Ejercicios Pro
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-black text-white">15 MIN — PRO</h3>
                    <p className="text-xs font-mono text-zinc-400 mt-1">
                      Máxima exigencia de precisión y resistencia para jugadores profesionales.
                    </p>
                    <div className="mt-3 space-y-1 text-[11px] font-mono text-zinc-500">
                      <div>1. Reacción Extrema • 2. Flick Largo</div>
                      <div>3. Puntería Quirúrgica • 4. Resistencia Pro</div>
                    </div>
                  </div>

                  <button
                    id="btn-routine-15min"
                    onClick={() => handleStartRoutine('routine_15min')}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>INICIAR RUTINA 15 MIN</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RÉCORDS & EVOLUCIÓN */}
          {activeTab === 'records' && (
            <TrainingRecordsAndEvolutionView
              sessions={sessions}
              recordsSummary={recordsSummary}
              onRefreshData={loadLocalTrainingData}
              onNavigate={onNavigate}
            />
          )}

          {/* Bottom Fair Play Notice Strip */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>
                FAIR PLAY: El Centro de Entrenamiento es 100% interactivo e independiente. No modifica archivos ni memoria del juego.
              </span>
            </div>
            <div className="text-zinc-600 hidden sm:block">
              {deviceInfo.model} • {deviceInfo.refreshRate}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
