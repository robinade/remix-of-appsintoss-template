/**
 * Eye Master AI 타입 정의
 */

// 화면 타입
export type ScreenType = 
  | 'home' 
  | 'calibration' 
  | 'vision-test' 
  | 'color-test' 
  | 'astigmatism-test' 
  | 'timer' 
  | 'exercise' 
  | 'checkin'
  | 'result';

// AI 거리 측정 상태
export type CalibrationStatus = 
  | 'loading_model' 
  | 'searching' 
  | 'too_close' 
  | 'too_far' 
  | 'perfect';

// 시력 테스트 결과
export interface VisionTestResult {
  date: string;
  leftEye: number;
  rightEye: number;
  bothEyes: number;
}

// 색약 테스트 결과
export interface ColorTestResult {
  date: string;
  score: number;
  total: number;
  type: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

// 난시 테스트 결과
export interface AstigmatismTestResult {
  date: string;
  hasAstigmatism: boolean;
  affectedAngles: number[];
}

// 일일 체크인 데이터
export interface DailyCheckin {
  date: string;
  dryness: 1 | 2 | 3 | 4 | 5;
  fatigue: 1 | 2 | 3 | 4 | 5;
  redness: 1 | 2 | 3 | 4 | 5;
  blurriness: 1 | 2 | 3 | 4 | 5;
}

// 사용자 통계
export interface UserStats {
  totalTests: number;
  streakDays: number;
  lastVisit: string;
  timerSessions: number;
  exerciseSessions: number;
  healthScore: number;
}

// 눈 운동 타입
export type ExerciseType = 'figure8' | 'circle' | 'blink' | 'focus';

// 스토리지 키
export const STORAGE_KEYS = {
  USER_STATS: 'eye-master-stats',
  VISION_RESULTS: 'eye-master-vision-results',
  COLOR_RESULTS: 'eye-master-color-results',
  ASTIGMATISM_RESULTS: 'eye-master-astigmatism-results',
  CHECKINS: 'eye-master-checkins',
} as const;
