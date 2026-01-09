/**
 * Achievement System Hook
 * 업적 시스템 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Achievement,
  AchievementProgress,
  GamificationState,
  DailyChallenge
} from '../types';
import { STORAGE_KEYS } from '../types';

// 업적 정의
export const ACHIEVEMENTS: Achievement[] = [
  // 테스트 관련 업적
  {
    id: 'first-test',
    name: '첫 검사 완료',
    description: '처음으로 눈 건강 검사를 완료했어요!',
    icon: '🎉',
    category: 'test',
    condition: { type: 'count', target: 1, metric: 'totalTests' },
    reward: 10,
  },
  {
    id: 'test-10',
    name: '검사 전문가',
    description: '눈 건강 검사를 10회 완료했어요!',
    icon: '🔬',
    category: 'test',
    condition: { type: 'count', target: 10, metric: 'totalTests' },
    reward: 50,
  },
  {
    id: 'perfect-vision',
    name: '완벽한 시력',
    description: '시력 검사에서 1.0 이상을 기록했어요!',
    icon: '👁️',
    category: 'test',
    condition: { type: 'score', target: 1.0, metric: 'visionScore' },
    reward: 100,
  },
  {
    id: 'color-master',
    name: '색채 마스터',
    description: '색각 검사에서 100% 정답을 맞췄어요!',
    icon: '🌈',
    category: 'test',
    condition: { type: 'score', target: 100, metric: 'colorScore' },
    reward: 100,
  },

  // 운동 관련 업적
  {
    id: 'first-exercise',
    name: '운동 시작',
    description: '처음으로 눈 운동을 완료했어요!',
    icon: '💪',
    category: 'exercise',
    condition: { type: 'count', target: 1, metric: 'exerciseSessions' },
    reward: 10,
  },
  {
    id: 'exercise-10',
    name: '꾸준한 운동러',
    description: '눈 운동을 10회 완료했어요!',
    icon: '🏃',
    category: 'exercise',
    condition: { type: 'count', target: 10, metric: 'exerciseSessions' },
    reward: 30,
  },
  {
    id: 'exercise-50',
    name: '운동 마니아',
    description: '눈 운동을 50회 완료했어요!',
    icon: '🏆',
    category: 'exercise',
    condition: { type: 'count', target: 50, metric: 'exerciseSessions' },
    reward: 100,
  },
  {
    id: 'exercise-100',
    name: '운동 마스터',
    description: '눈 운동을 100회 완료했어요!',
    icon: '💯',
    category: 'exercise',
    condition: { type: 'count', target: 100, metric: 'exerciseSessions' },
    reward: 200,
  },
  {
    id: 'all-courses',
    name: '코스 정복자',
    description: '모든 운동 코스를 완료했어요!',
    icon: '🎯',
    category: 'exercise',
    condition: { type: 'special', target: 5, metric: 'uniqueCourses' },
    reward: 150,
  },

  // 타이머 관련 업적
  {
    id: 'first-timer',
    name: '첫 휴식',
    description: '처음으로 20-20-20 타이머를 사용했어요!',
    icon: '⏰',
    category: 'exercise',
    condition: { type: 'count', target: 1, metric: 'timerSessions' },
    reward: 10,
  },
  {
    id: 'timer-10',
    name: '휴식의 달인',
    description: '20-20-20 타이머를 10회 완료했어요!',
    icon: '⌛',
    category: 'exercise',
    condition: { type: 'count', target: 10, metric: 'timerSessions' },
    reward: 30,
  },
  {
    id: 'timer-50',
    name: '타이머 마스터',
    description: '20-20-20 타이머를 50회 완료했어요!',
    icon: '🕐',
    category: 'exercise',
    condition: { type: 'count', target: 50, metric: 'timerSessions' },
    reward: 100,
  },

  // 연속 기록 업적
  {
    id: 'streak-3',
    name: '3일 연속',
    description: '3일 연속으로 눈 건강을 관리했어요!',
    icon: '🔥',
    category: 'streak',
    condition: { type: 'streak', target: 3, metric: 'streakDays' },
    reward: 20,
  },
  {
    id: 'streak-7',
    name: '일주일 연속',
    description: '7일 연속으로 눈 건강을 관리했어요!',
    icon: '🔥',
    category: 'streak',
    condition: { type: 'streak', target: 7, metric: 'streakDays' },
    reward: 50,
  },
  {
    id: 'streak-14',
    name: '2주 연속',
    description: '14일 연속으로 눈 건강을 관리했어요!',
    icon: '🔥',
    category: 'streak',
    condition: { type: 'streak', target: 14, metric: 'streakDays' },
    reward: 100,
  },
  {
    id: 'streak-30',
    name: '한달 연속',
    description: '30일 연속으로 눈 건강을 관리했어요!',
    icon: '🏅',
    category: 'streak',
    condition: { type: 'streak', target: 30, metric: 'streakDays' },
    reward: 300,
  },

  // 특별 업적
  {
    id: 'early-bird',
    name: '얼리버드',
    description: '오전 7시 이전에 눈 운동을 했어요!',
    icon: '🐦',
    category: 'special',
    condition: { type: 'special', target: 1, metric: 'earlyExercise' },
    reward: 30,
  },
  {
    id: 'night-owl',
    name: '야행성',
    description: '밤 10시 이후에 눈 운동을 했어요!',
    icon: '🦉',
    category: 'special',
    condition: { type: 'special', target: 1, metric: 'lateExercise' },
    reward: 30,
  },
  {
    id: 'weekend-warrior',
    name: '주말 전사',
    description: '주말에 눈 건강 관리를 했어요!',
    icon: '⚔️',
    category: 'special',
    condition: { type: 'special', target: 1, metric: 'weekendActivity' },
    reward: 20,
  },
  {
    id: 'daily-complete',
    name: '하루 완성',
    description: '하루에 검사, 운동, 타이머를 모두 완료했어요!',
    icon: '✨',
    category: 'special',
    condition: { type: 'special', target: 1, metric: 'dailyComplete' },
    reward: 50,
  },
  {
    id: 'health-score-90',
    name: '눈 건강 우수',
    description: '눈 건강 점수 90점 이상을 달성했어요!',
    icon: '🌟',
    category: 'special',
    condition: { type: 'score', target: 90, metric: 'healthScore' },
    reward: 100,
  },
];

// 일일 챌린지 템플릿
const DAILY_CHALLENGE_TEMPLATES = [
  { type: 'exercise' as const, task: '눈 운동 코스 1개 완료하기', target: 1, reward: 15 },
  { type: 'exercise' as const, task: '눈 운동 코스 2개 완료하기', target: 2, reward: 25 },
  { type: 'exercise' as const, task: '눈 운동 5분 이상 하기', target: 300, reward: 20 },
  { type: 'timer' as const, task: '20-20-20 타이머 3회 사용하기', target: 3, reward: 20 },
  { type: 'timer' as const, task: '20-20-20 타이머 5회 사용하기', target: 5, reward: 30 },
  { type: 'test' as const, task: '시력 검사 완료하기', target: 1, reward: 15 },
  { type: 'test' as const, task: '색각 검사 완료하기', target: 1, reward: 15 },
  { type: 'checkin' as const, task: '오늘의 눈 상태 체크인하기', target: 1, reward: 10 },
  { type: 'streak' as const, task: '연속 기록 유지하기', target: 1, reward: 25 },
];

// 레벨 계산
export function calculateLevel(points: number): number {
  // 레벨업 필요 포인트: 100, 250, 450, 700, 1000, 1350, ...
  // 공식: level = floor(sqrt(points / 50))
  return Math.max(1, Math.floor(Math.sqrt(points / 50)) + 1);
}

export function getPointsForLevel(level: number): number {
  // 해당 레벨에 필요한 총 포인트
  return Math.pow(level - 1, 2) * 50;
}

export function getPointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevelPoints = getPointsForLevel(currentLevel + 1);
  return nextLevelPoints - currentPoints;
}

// 기본 상태
const DEFAULT_GAMIFICATION_STATE: GamificationState = {
  points: 0,
  level: 1,
  achievements: [],
  dailyChallenges: [],
  lastChallengeRefresh: new Date().toISOString().split('T')[0],
};

export function useAchievements() {
  const [state, setState] = useState<GamificationState>(DEFAULT_GAMIFICATION_STATE);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // 로컬 스토리지에서 상태 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(parsed);

        // 일일 챌린지 갱신 체크
        const today = new Date().toISOString().split('T')[0];
        if (parsed.lastChallengeRefresh !== today) {
          refreshDailyChallenges(parsed);
        }
      } else {
        // 첫 실행시 일일 챌린지 생성
        refreshDailyChallenges(DEFAULT_GAMIFICATION_STATE);
      }
    } catch (e) {
      console.error('Failed to load gamification state:', e);
    }
  }, []);

  // 상태 저장
  const saveState = useCallback((newState: GamificationState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(newState));
  }, []);

  // 일일 챌린지 갱신
  const refreshDailyChallenges = useCallback((currentState: GamificationState) => {
    const today = new Date().toISOString().split('T')[0];

    // 랜덤하게 3개의 챌린지 선택
    const shuffled = [...DAILY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const newChallenges: DailyChallenge[] = selected.map((template, index) => ({
      id: `daily-${today}-${index}`,
      date: today,
      type: template.type,
      task: template.task,
      target: template.target,
      current: 0,
      reward: template.reward,
      completed: false,
    }));

    const newState = {
      ...currentState,
      dailyChallenges: newChallenges,
      lastChallengeRefresh: today,
    };
    saveState(newState);
  }, [saveState]);

  // 포인트 추가
  const addPoints = useCallback((points: number) => {
    setState(prev => {
      const newPoints = prev.points + points;
      const newLevel = calculateLevel(newPoints);
      const newState = {
        ...prev,
        points: newPoints,
        level: newLevel,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // 업적 진행 상황 업데이트
  const updateProgress = useCallback((metric: string, value: number, isIncrement = true) => {
    setState(prev => {
      const unlocked: Achievement[] = [];

      const newAchievements = ACHIEVEMENTS.map(achievement => {
        // 이미 완료된 업적 확인
        const existingProgress = prev.achievements.find(
          p => p.achievementId === achievement.id
        );

        if (existingProgress?.completed) {
          return existingProgress;
        }

        // 이 메트릭과 관련된 업적인지 확인
        if (achievement.condition.metric !== metric) {
          return existingProgress || {
            achievementId: achievement.id,
            currentValue: 0,
            completed: false,
          };
        }

        // 진행 상황 업데이트
        const currentValue = isIncrement
          ? (existingProgress?.currentValue || 0) + value
          : value;

        const completed = currentValue >= achievement.condition.target;

        // 새로 달성한 업적 기록
        if (completed && !existingProgress?.completed) {
          unlocked.push(achievement);
        }

        return {
          achievementId: achievement.id,
          currentValue,
          completed,
          completedAt: completed && !existingProgress?.completed
            ? new Date().toISOString()
            : existingProgress?.completedAt,
        };
      });

      // 새로 달성한 업적 알림
      if (unlocked.length > 0) {
        setNewlyUnlocked(unlocked);
        // 포인트 지급
        const totalReward = unlocked.reduce((sum, a) => sum + a.reward, 0);
        setTimeout(() => {
          addPoints(totalReward);
        }, 100);
      }

      // 기존 진행 상황 유지하면서 새로운 것 추가
      const achievementMap = new Map(
        prev.achievements.map(a => [a.achievementId, a])
      );
      newAchievements.forEach(a => {
        achievementMap.set(a.achievementId, a);
      });

      const newState = {
        ...prev,
        achievements: Array.from(achievementMap.values()),
      };
      saveState(newState);
      return newState;
    });
  }, [saveState, addPoints]);

  // 일일 챌린지 진행 상황 업데이트
  const updateChallengeProgress = useCallback((
    type: DailyChallenge['type'],
    increment: number = 1
  ) => {
    setState(prev => {
      let rewardEarned = 0;

      const updatedChallenges = prev.dailyChallenges.map(challenge => {
        if (challenge.type !== type || challenge.completed) {
          return challenge;
        }

        const newCurrent = challenge.current + increment;
        const completed = newCurrent >= challenge.target;

        if (completed && !challenge.completed) {
          rewardEarned += challenge.reward;
        }

        return {
          ...challenge,
          current: newCurrent,
          completed,
        };
      });

      if (rewardEarned > 0) {
        setTimeout(() => {
          addPoints(rewardEarned);
        }, 100);
      }

      const newState = {
        ...prev,
        dailyChallenges: updatedChallenges,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState, addPoints]);

  // 업적 달성 알림 초기화
  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  // 업적 진행률 가져오기
  const getAchievementProgress = useCallback((achievementId: string): AchievementProgress | null => {
    return state.achievements.find(a => a.achievementId === achievementId) || null;
  }, [state.achievements]);

  // 달성한 업적 목록
  const completedAchievements = ACHIEVEMENTS.filter(achievement => {
    const progress = state.achievements.find(p => p.achievementId === achievement.id);
    return progress?.completed;
  });

  // 미달성 업적 목록
  const pendingAchievements = ACHIEVEMENTS.filter(achievement => {
    const progress = state.achievements.find(p => p.achievementId === achievement.id);
    return !progress?.completed;
  });

  // 오늘의 진행률
  const todayProgress = {
    challenges: state.dailyChallenges,
    completedCount: state.dailyChallenges.filter(c => c.completed).length,
    totalCount: state.dailyChallenges.length,
    totalReward: state.dailyChallenges
      .filter(c => !c.completed)
      .reduce((sum, c) => sum + c.reward, 0),
  };

  return {
    // 상태
    points: state.points,
    level: state.level,
    achievements: state.achievements,
    dailyChallenges: state.dailyChallenges,

    // 계산된 값
    completedAchievements,
    pendingAchievements,
    todayProgress,
    newlyUnlocked,
    pointsToNextLevel: getPointsToNextLevel(state.points),
    nextLevelPoints: getPointsForLevel(state.level + 1),
    currentLevelPoints: getPointsForLevel(state.level),

    // 메서드
    addPoints,
    updateProgress,
    updateChallengeProgress,
    getAchievementProgress,
    clearNewlyUnlocked,
    refreshDailyChallenges: () => refreshDailyChallenges(state),
  };
}

export { ACHIEVEMENTS as achievements };
