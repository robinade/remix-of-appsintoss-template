/**
 * 20-20-20 규칙 타이머 컴포넌트
 */

import { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Eye, Bell } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';

interface Timer2020Props {
  onSessionComplete?: () => void;
  onBack: () => void;
}

const WORK_TIME = 20 * 60; // 20분
const REST_TIME = 20; // 20초

export function Timer2020({ onSessionComplete, onBack }: Timer2020Props) {
  const { haptic } = useAppsInToss();
  const [phase, setPhase] = useState<'idle' | 'work' | 'rest' | 'complete'>('idle');
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);

  // 타이머 로직
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handlePhaseEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handlePhaseEnd = useCallback(async () => {
    await haptic('success');
    
    if (phase === 'work') {
      setPhase('rest');
      setTimeLeft(REST_TIME);
    } else if (phase === 'rest') {
      setPhase('complete');
      setSessionsToday(prev => prev + 1);
      onSessionComplete?.();
    }
  }, [phase, haptic, onSessionComplete]);

  const handleStart = async () => {
    await haptic('tap');
    setPhase('work');
    setTimeLeft(WORK_TIME);
    setIsRunning(true);
  };

  const handleToggle = async () => {
    await haptic('tap');
    setIsRunning(prev => !prev);
  };

  const handleReset = async () => {
    await haptic('tap');
    setPhase('idle');
    setTimeLeft(WORK_TIME);
    setIsRunning(false);
  };

  const handleContinue = async () => {
    await haptic('tap');
    setPhase('work');
    setTimeLeft(WORK_TIME);
    setIsRunning(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = phase === 'work' 
    ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100 
    : phase === 'rest' 
      ? ((REST_TIME - timeLeft) / REST_TIME) * 100 
      : 0;

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title3 text-foreground">20-20-20 규칙</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-caption1 text-foreground font-medium">
              오늘 {sessionsToday}회
            </span>
          </div>
        </div>
      </div>

      {/* 타이머 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* 원형 진행률 */}
        <div className="relative w-64 h-64 mb-8">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* 배경 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="8"
            />
            {/* 진행 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={phase === 'rest' ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>

          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-caption1 text-muted-foreground mb-1">
              {phase === 'idle' && '준비'}
              {phase === 'work' && '작업 중'}
              {phase === 'rest' && '눈 휴식'}
              {phase === 'complete' && '완료!'}
            </p>
            <p className="text-5xl font-black text-foreground">
              {formatTime(timeLeft)}
            </p>
            <p className="text-caption1 text-muted-foreground mt-1">
              {phase === 'work' && '집중하세요'}
              {phase === 'rest' && '6m 먼 곳을 바라보세요'}
            </p>
          </div>
        </div>

        {/* 상태별 안내 */}
        {phase === 'rest' && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-success/10 mb-6">
            <Eye className="w-6 h-6 text-success" />
            <div>
              <p className="text-body2 font-semibold text-success">눈 휴식 시간!</p>
              <p className="text-caption1 text-success/80">
                20초간 6m 이상 먼 곳을 바라보세요
              </p>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-primary/10 mb-6">
            <Timer className="w-6 h-6 text-primary" />
            <div>
              <p className="text-body2 font-semibold text-primary">세션 완료!</p>
              <p className="text-caption1 text-primary/80">
                눈의 피로가 풀렸습니다
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 규칙 설명 */}
      <div className="px-6 mb-4">
        <div className="bg-secondary rounded-2xl p-4">
          <p className="text-caption1 text-muted-foreground text-center">
            <strong className="text-foreground">20-20-20 규칙:</strong> 20분마다 20초간 20피트(6m) 먼 곳을 바라보면 디지털 눈 피로를 예방합니다
          </p>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="p-4 space-y-3">
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-body1 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" /> 타이머 시작
          </button>
        )}

        {(phase === 'work' || phase === 'rest') && (
          <div className="flex gap-3">
            <button
              onClick={handleToggle}
              className={`flex-1 py-4 rounded-2xl font-bold text-body1 flex items-center justify-center gap-2 ${
                isRunning 
                  ? 'bg-warning text-white' 
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? '일시정지' : '재개'}
            </button>
            <button
              onClick={handleReset}
              className="py-4 px-6 rounded-2xl bg-secondary text-muted-foreground font-bold"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {phase === 'complete' && (
          <>
            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-body1"
            >
              한 번 더 하기
            </button>
            <button
              onClick={onBack}
              className="w-full py-4 rounded-2xl bg-secondary text-muted-foreground font-bold text-body1"
            >
              홈으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
