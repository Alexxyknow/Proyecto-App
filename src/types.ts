export type ScreenId = 'home' | 'dashboard' | 'calibrator' | 'adaptive' | 'evolution' | 'training' | 'network' | 'sensi' | 'hud' | 'reflex' | 'stats' | 'guide';

export interface DeviceInfo {
  model: string;
  screenSize: string;
  refreshRate: string;
  iosVersion: string;
  connectionType: string;
  touchSampleRate: string;
  chipset?: string;
  diagonalInches?: number;
}

export interface WeaponPreset {
  id: string;
  name: string;
  category: 'escopetas' | 'smg' | 'ar' | 'sniper' | 'pistolas';
  icon: string;
  general: number; // Scale 0 - 200
  redDot: number; // Scale 0 - 200
  scope2x: number; // Scale 0 - 200
  scope4x: number; // Scale 0 - 200
  sniperScope: number; // Scale 0 - 200
  freeLook: number; // Scale 0 - 200
  fireButtonSize: number; // in %
  liftTechnique: string;
  description: string;
}

export interface SensitivityProfile {
  id: string;
  name: string;
  targetDevice: string;
  playStyle: 'rusher' | 'precision' | 'sniper' | 'equilibrado';
  general: number; // Scale 0 - 200
  redDot: number; // Scale 0 - 200
  scope2x: number; // Scale 0 - 200
  scope4x: number; // Scale 0 - 200
  sniperScope: number; // Scale 0 - 200
  freeLook: number; // Scale 0 - 200
  fireButtonSize: number; // in %
  fireButtonPosition: string; // e.g. "Inferior Derecha 45%"
  dpiRecommended: string;
  notes: string;
  savedAt?: string;
}

export interface CalibrationPlayerProfile {
  deviceModel: string;
  hudFingers: '2' | '3' | '4';
  fireButtonSize: number;
  screenProtector: 'ninguno' | 'cristal' | 'mate';
  mainWeapon: 'escopeta' | 'smg' | 'ar' | 'sniper' | 'onetap';
}

export interface CalibrationSensiConfig {
  general: number;
  redDot: number;
  scope2x: number;
  scope4x: number;
  sniperScope: number;
  freeLook: number;
}

export interface FlickRoundMetric {
  roundIndex: number;
  reactionTimeMs: number;
  distancePx: number;
  targetDistancePx: number;
  swipeAngleDeg: number;
  accuracyPercent: number;
  overshootPx: number;
}

export interface FlickSessionSummary {
  roundsCompleted: number;
  avgReactionTimeMs: number;
  avgAccuracy: number;
  avgOvershootPx: number;
  consistencyScore: number; // 0 - 100%
  flickTrend: 'too_slow' | 'too_fast_overshoot' | 'inconsistent' | 'optimal_control';
  behaviorAnalysis: string;
}

export interface CalibrationRecommendation {
  generalOffset: number;
  redDotOffset: number;
  scope2xOffset: number;
  scope4xOffset: number;
  sniperOffset: number;
  freeLookOffset: number;
  recommendedSensi: CalibrationSensiConfig;
  reason: string;
}

export interface CalibrationRecord {
  id: string;
  timestamp: string;
  playerProfile: CalibrationPlayerProfile;
  initialSensi: CalibrationSensiConfig;
  testMetrics: FlickSessionSummary;
  recommendation: CalibrationRecommendation;
  finalScore: number; // 0 - 100
  scoreCategory: 'EXCELENTE' | 'BUENO' | 'ESTABLE' | 'NECESITA AJUSTE';
}

export interface PingRecord {
  timestamp: string;
  ping: number;
  jitter: number;
  packetLoss: number;
  server: string;
  status: 'excelente' | 'bueno' | 'inestable' | 'critico';
}

export interface GameSession {
  id: string;
  date: string;
  gameMode: string;
  durationMinutes: number;
  avgPing: number;
  maxPing: number;
  stabilityScore: number; // 0 - 100%
  deviceTempEstimate: 'Normal' | 'Tibio' | 'Caliente';
  notes: string;
}

export interface ServerPingNode {
  id: string;
  name: string;
  region: string;
  flag: string;
  basePing: number;
  currentPing: number;
  status: 'online' | 'degraded';
}

export interface DragTestResult {
  swipeSpeedMs: number;
  distancePx: number;
  liftAngleDeg: number;
  velocityScore: number; // 0 - 100
  accuracyGrade: 'S+' | 'A' | 'B' | 'C';
  advice: string;
}

export type ConfidenceTier = 'insufficient' | 'low' | 'medium' | 'high';

export interface ConfidenceAssessment {
  tier: ConfidenceTier;
  label: 'Datos insuficientes' | 'Confianza baja' | 'Confianza media' | 'Confianza alta';
  testCount: number;
  percentage: number;
  description: string;
}

export interface PlayerTrendAnalysis {
  flickSpeed: 'slow' | 'normal' | 'fast';
  overshootBehavior: 'undershoot' | 'balanced' | 'overshoot';
  consistencyGrade: 'inconsistent' | 'moderate' | 'high';
  precisionGrade: 'low' | 'good' | 'elite';
  primaryTrendTitle: string;
  primaryRecommendation: string;
  detectedLabels: string[];
  avgReactionTimeMs: number;
  avgAccuracyPercent: number;
  avgConsistencyPercent: number;
  bestCalibrationScore: number;
}

export interface AdaptiveAdjustment {
  id: string;
  parameter: 'general' | 'redDot' | 'scope2x' | 'scope4x' | 'sniperScope' | 'freeLook';
  paramLabel: string;
  currentValue: number;
  recommendedValue: number;
  delta: number; // ±1, ±2, ±3, ±5
  reason: string;
  status: 'pending' | 'tested' | 'accepted' | 'rejected';
}

export interface WeaponSensiProfilesMap {
  escopeta: CalibrationSensiConfig;
  smg: CalibrationSensiConfig;
  ar: CalibrationSensiConfig;
  sniper: CalibrationSensiConfig;
  onetap: CalibrationSensiConfig;
}

export interface DeviceAdaptiveProfile {
  id: string;
  deviceModel: string;
  hudFingers: '2' | '3' | '4';
  fireButtonSize: number;
  screenProtector: 'ninguno' | 'cristal' | 'mate';
  mainWeapon: 'escopeta' | 'smg' | 'ar' | 'sniper' | 'onetap';
  currentSensi: CalibrationSensiConfig;
  weaponProfiles: WeaponSensiProfilesMap;
  lastUpdated: string;
}

export interface EvolutionChartDataPoint {
  index: number;
  testId: string;
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
  reactionTimeMs: number;
  accuracyPercent: number;
  consistencyScore: number;
  calibrationScore: number;
  weapon: string;
  hud: string;
  device: string;
  generalSensi: number;
}

export type EvolutionTrendStatus = 'MEJORANDO' | 'ESTABLE' | 'EMPEORANDO' | 'DATOS INSUFICIENTES';

export interface EvolutionTrendResult {
  status: EvolutionTrendStatus;
  statusColor: string;
  scoreDiff: number; // difference in score
  reactionDiffMs: number; // negative is faster
  accuracyDiffPct: number;
  consistencyDiffPct: number;
  description: string;
  sampleSize: number;
}

export interface EvolutionSummaryStats {
  bestScore: number;
  avgScore: number;
  bestReactionTimeMs: number;
  avgReactionTimeMs: number;
  avgAccuracyPercent: number;
  avgConsistencyPercent: number;
  totalSessions: number;
}

export interface EvolutionGoals {
  targetScore: number; // e.g. 90
  targetReactionTimeMs: number; // e.g. 115
  targetAccuracyPercent: number; // e.g. 85
  targetConsistencyPercent: number; // e.g. 80
}

export interface EvolutionStreak {
  currentStreak: number;
  bestStreak: number;
  isActive: boolean;
  streakStatusText: string;
}

export interface EvolutionComparisonMetric {
  label: string;
  lastValue: number;
  bestValue: number;
  avgValue: number;
  unit: string;
  diffLastVsBest: number;
  diffLastVsAvg: number;
  isHigherBetter: boolean;
}

// ----------------------------------------------------
// CENTRO DE ENTRENAMIENTO SENSI 33 TYPES
// ----------------------------------------------------

export type TrainingModuleId = 'flick' | 'reaction' | 'precision' | 'consistency';

export type TrainingDifficulty = 'facil' | 'normal' | 'dificil' | 'extremo';

export type TrainingRoutineId = 'routine_5min' | 'routine_10min' | 'routine_15min';

export type TrainingScoreRank = 'S+' | 'S' | 'A' | 'B' | 'C';

export interface TrainingRoutineConfig {
  id: TrainingRoutineId;
  name: string;
  durationLabel: string;
  description: string;
  badgeIcon: string;
  modules: Array<{
    moduleId: TrainingModuleId;
    difficulty: TrainingDifficulty;
    reps: number;
    title: string;
  }>;
}

export interface TrainingFlickShotData {
  targetIndex: number;
  reactionTimeMs: number;
  distancePx: number;
  accuracyScore: number; // 0-100 based on hit proximity
  isHit: boolean;
  isOvershoot: boolean;
  isUndershoot: boolean;
  offsetPx: number;
}

export interface TrainingReactionRoundData {
  roundIndex: number;
  reactionTimeMs: number;
  valid: boolean;
  isEarlyTap: boolean;
}

export interface TrainingPrecisionTargetData {
  targetIndex: number;
  timeSpentMs: number;
  targetRadius: number;
  hit: boolean;
  points: number;
}

export interface TrainingConsistencyAttemptData {
  attemptIndex: number;
  reactionTimeMs: number;
  accuracyScore: number;
  isFirstHalf: boolean;
}

export interface TrainingSessionRecord {
  id: string;
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
  module: TrainingModuleId;
  difficulty: TrainingDifficulty;
  routineId?: TrainingRoutineId;
  routineStep?: number;
  routineTotalSteps?: number;
  score: number; // 0 - 100 internal score
  rank: TrainingScoreRank;
  reactionTimeMs: number; // Avg reaction ms
  bestReactionTimeMs: number;
  worstReactionTimeMs: number;
  accuracyPercent: number;
  consistencyScore: number; // 0 - 100
  hits: number;
  misses: number;
  totalRounds: number;
  overshootCount?: number;
  undershootCount?: number;
  movementDistanceAvg?: number;
  earlyTapsCount?: number;
  accuracyVariationPercent?: number; // e.g. -4% or +2%
  timeVariationMs?: number; // e.g. +18ms
  detectedTrend: string;
  recommendation: string;
  deviceModel?: string;
}

export interface TrainingRecordsSummary {
  bestFlickScore: number;
  bestFlickTimeMs: number;
  bestReactionMs: number;
  bestPrecisionPercent: number;
  bestConsistencyScore: number;
  bestGlobalScore: number;
  totalTrainingSessions: number;
  lastUpdated: string;
}

