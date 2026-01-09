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

// 눈 운동 타입 (확장됨)
export type ExerciseType =
  | 'figure8'      // 8자 운동
  | 'circle'       // 원 운동
  | 'blink'        // 깜빡임 훈련
  | 'focus'        // 초점 훈련
  | 'near-far'     // 원근 초점 전환
  | 'palming'      // 팜밍 (손바닥 눈 휴식)
  | 'pencil-pushup' // 연필 푸쉬업 (수렴 운동)
  | 'peripheral'   // 주변 시야 확장
  | 'distance-gaze' // 원거리 응시
  | 'slow-blink'   // 천천히 깜빡이기
  | 'massage-guide' // 눈 마사지 가이드
  | 'breathing';   // 눈 휴식 호흡

// 운동 코스 정의
export interface ExerciseCourse {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  duration: string;
  durationSeconds: number;
  icon: string;
  color: string;
  exercises: ExerciseType[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'relief' | 'training' | 'relaxation' | 'gamer';
}

// 개별 운동 정보
export interface ExerciseInfo {
  id: ExerciseType;
  name: string;
  nameEn: string;
  description: string;
  duration: number;
  instructions: string[];
  benefits: string[];
  category: 'convergence' | 'relaxation' | 'flexibility' | 'strain-relief';
}

// 운동 세션 결과
export interface ExerciseSessionResult {
  date: string;
  courseId: string;
  completedExercises: ExerciseType[];
  totalDuration: number;
  completed: boolean;
}

// 업적 정의
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'test' | 'exercise' | 'streak' | 'special';
  condition: {
    type: 'count' | 'score' | 'streak' | 'time' | 'special';
    target: number;
    metric: string;
  };
  reward: number; // 포인트 보상
  unlockedAt?: string; // 달성 일시
}

// 사용자 업적 진행 상황
export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  completed: boolean;
  completedAt?: string;
}

// 일일 챌린지
export interface DailyChallenge {
  id: string;
  date: string;
  type: 'exercise' | 'timer' | 'test' | 'streak' | 'checkin';
  task: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
}

// 게임화 상태
export interface GamificationState {
  points: number;
  level: number;
  achievements: AchievementProgress[];
  dailyChallenges: DailyChallenge[];
  lastChallengeRefresh: string;
}

// 스토리지 키
export const STORAGE_KEYS = {
  USER_STATS: 'eye-master-stats',
  VISION_RESULTS: 'eye-master-vision-results',
  COLOR_RESULTS: 'eye-master-color-results',
  ASTIGMATISM_RESULTS: 'eye-master-astigmatism-results',
  CHECKINS: 'eye-master-checkins',
  GAMIFICATION: 'eye-master-gamification',
  EXERCISE_SESSIONS: 'eye-master-exercise-sessions',
} as const;
