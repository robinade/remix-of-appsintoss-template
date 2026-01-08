/**
 * 눈 건강 데이터 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { 
  UserStats, 
  VisionTestResult, 
  DailyCheckin,
  STORAGE_KEYS 
} from '../types';

const DEFAULT_STATS: UserStats = {
  totalTests: 0,
  streakDays: 0,
  lastVisit: '',
  timerSessions: 0,
  exerciseSessions: 0,
  healthScore: 70,
};

export function useEyeHealth() {
  const { getStorageJSON, setStorageJSON } = useAppsInToss();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [visionResults, setVisionResults] = useState<VisionTestResult[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const savedStats = await getStorageJSON<UserStats>(STORAGE_KEYS.USER_STATS);
      const savedVision = await getStorageJSON<VisionTestResult[]>(STORAGE_KEYS.VISION_RESULTS);
      const savedCheckins = await getStorageJSON<DailyCheckin[]>(STORAGE_KEYS.CHECKINS);

      if (savedStats) setStats(savedStats);
      if (savedVision) setVisionResults(savedVision);
      if (savedCheckins) setCheckins(savedCheckins);

      // 스트릭 업데이트
      const today = new Date().toISOString().split('T')[0];
      if (savedStats?.lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const newStreak = savedStats?.lastVisit === yesterdayStr 
          ? (savedStats.streakDays || 0) + 1 
          : 1;
        
        const updatedStats = {
          ...savedStats,
          ...DEFAULT_STATS,
          ...savedStats,
          lastVisit: today,
          streakDays: newStreak,
        };
        setStats(updatedStats);
        await setStorageJSON(STORAGE_KEYS.USER_STATS, updatedStats);
      }

      setIsLoaded(true);
    };
    loadData();
  }, [getStorageJSON, setStorageJSON]);

  // 테스트 완료 기록
  const recordTest = useCallback(async () => {
    const newStats = {
      ...stats,
      totalTests: stats.totalTests + 1,
      healthScore: Math.min(100, stats.healthScore + 2),
    };
    setStats(newStats);
    await setStorageJSON(STORAGE_KEYS.USER_STATS, newStats);
  }, [stats, setStorageJSON]);

  // 시력 테스트 결과 저장
  const saveVisionResult = useCallback(async (result: VisionTestResult) => {
    const newResults = [...visionResults, result].slice(-10);
    setVisionResults(newResults);
    await setStorageJSON(STORAGE_KEYS.VISION_RESULTS, newResults);
    await recordTest();
  }, [visionResults, setStorageJSON, recordTest]);

  // 타이머 세션 기록
  const recordTimerSession = useCallback(async () => {
    const newStats = {
      ...stats,
      timerSessions: stats.timerSessions + 1,
      healthScore: Math.min(100, stats.healthScore + 1),
    };
    setStats(newStats);
    await setStorageJSON(STORAGE_KEYS.USER_STATS, newStats);
  }, [stats, setStorageJSON]);

  // 운동 세션 기록
  const recordExerciseSession = useCallback(async () => {
    const newStats = {
      ...stats,
      exerciseSessions: stats.exerciseSessions + 1,
      healthScore: Math.min(100, stats.healthScore + 3),
    };
    setStats(newStats);
    await setStorageJSON(STORAGE_KEYS.USER_STATS, newStats);
  }, [stats, setStorageJSON]);

  // 체크인 저장
  const saveCheckin = useCallback(async (checkin: DailyCheckin) => {
    const existing = checkins.filter(c => c.date !== checkin.date);
    const newCheckins = [...existing, checkin].slice(-30);
    setCheckins(newCheckins);
    await setStorageJSON(STORAGE_KEYS.CHECKINS, newCheckins);
  }, [checkins, setStorageJSON]);

  return {
    stats,
    visionResults,
    checkins,
    isLoaded,
    recordTest,
    saveVisionResult,
    recordTimerSession,
    recordExerciseSession,
    saveCheckin,
  };
}
