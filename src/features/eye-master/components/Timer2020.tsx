/**
 * 20-20-20 규칙 타이머 컴포넌트 (Enhanced)
 *
 * 개선 사항:
 * - Apps-in-Toss 햄틱 피드백 (성공, 경고, 탭 진동)
 * - 휴식 시 가이드 호흡 (4-4-4 패턴)
 * - 눈 깜빡임 리마인더
 * - 세션 기록 및 분석
 * - Eyeri 캐릭터 통합
 *
 * 참고: Apps-in-Toss WebView에서는 Web Notification API가 지원되지 않습니다.
 * 대신 햄틱 피드백으로 사용자에게 알림을 전달합니다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Wind,
  Sparkles,
} from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { EyeriCharacter } from './EyeriCharacter';
import { useAchievements } from '../hooks/useAchievements';

interface Timer2020Props {
  onSessionComplete?: () => void;
  onBack: () => void;
}

const WORK_TIME = 20 * 60; // 20분
const REST_TIME = 20; // 20초
const BREATHING_CYCLE = 4; // 4초 호흡 주기

// 휴식 활동 타입
type RestActivity = 'breathing' | 'blinking' | 'gazing';

// 세션 기록
interface TimerSession {
  id: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  skipped: boolean;
}

// Apps-in-Toss에서는 Web Notification API가 지원되지 않으므로
// 햄틱 피드백을 통해 사용자에게 알림을 전달합니다.
// 햄틱 타입: 'tap' (가벼운 터치), 'success' (성공), 'warning' (경고), 'error' (오류)

// 호흡 가이드 컴포넌트 - Premium Design
function BreathingGuide({ phase }: { phase: 'inhale' | 'hold' | 'exhale' }) {
  const phaseText = {
    inhale: '숨을 들이쉬세요',
    hold: '잠시 멈춰요',
    exhale: '천천히 내쉬세요',
  };

  const phaseStyles = {
    inhale: {
      bg: 'bg-[hsl(var(--health-blue-light))]',
      iconBg: 'icon-gradient-blue',
      text: 'text-[hsl(var(--health-blue))]',
      scale: 'scale-110'
    },
    hold: {
      bg: 'bg-[hsl(var(--health-violet-light))]',
      iconBg: 'icon-gradient-violet',
      text: 'text-[hsl(var(--health-violet))]',
      scale: 'scale-100'
    },
    exhale: {
      bg: 'bg-[hsl(var(--health-green-light))]',
      iconBg: 'icon-gradient-green',
      text: 'text-[hsl(var(--health-green))]',
      scale: 'scale-90'
    }
  };

  const style = phaseStyles[phase];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          icon-container-xl rounded-full flex items-center justify-center
          transition-all duration-1000 ${style.scale} ${style.bg}
        `}
        style={{ width: '96px', height: '96px' }}
      >
        <Wind className={`w-10 h-10 ${style.text}`} />
      </div>
      <p className={`mt-4 text-body1 font-semibold ${style.text}`}>
        {phaseText[phase]}
      </p>
    </div>
  );
}

// 깜빡임 가이드 컴포넌트 - Premium Design
function BlinkingGuide({ count }: { count: number }) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 500);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-5">
        <div
          className={`
            w-16 h-9 bg-white rounded-full border-2 border-[hsl(var(--neutral-300))]
            flex items-center justify-center transition-all duration-200
            shadow-sm
            ${isBlinking ? 'scale-y-[0.1]' : ''}
          `}
        >
          <div className="w-5 h-5 bg-[hsl(var(--neutral-800))] rounded-full">
            <div className="w-2 h-2 bg-white rounded-full ml-0.5 mt-0.5" />
          </div>
        </div>
        <div
          className={`
            w-16 h-9 bg-white rounded-full border-2 border-[hsl(var(--neutral-300))]
            flex items-center justify-center transition-all duration-200
            shadow-sm
            ${isBlinking ? 'scale-y-[0.1]' : ''}
          `}
        >
          <div className="w-5 h-5 bg-[hsl(var(--neutral-800))] rounded-full">
            <div className="w-2 h-2 bg-white rounded-full ml-0.5 mt-0.5" />
          </div>
        </div>
      </div>
      <p className="mt-4 text-body1 font-semibold text-[hsl(var(--health-amber))]">
        천천히 깜빡이세요
      </p>
      <div className="badge-stat-coral mt-2">
        {count}/10회
      </div>
    </div>
  );
}

// 원거리 응시 가이드 컴포넌트 - Premium Design
function GazingGuide() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--health-blue))] to-[hsl(var(--health-green))] blur-lg opacity-30" />
        {/* Main icon */}
        <div className="relative icon-container-xl icon-vivid-blue rounded-full">
          <Eye className="w-10 h-10 text-white" />
        </div>
        {/* Decorations */}
        <div className="absolute -right-3 -top-1 w-8 h-8 rounded-lg bg-[hsl(var(--health-green-light))] flex items-center justify-center animate-float" style={{ animationDelay: '0ms' }}>
          <span className="text-lg">🌳</span>
        </div>
        <div className="absolute -left-3 -bottom-1 w-8 h-8 rounded-lg bg-[hsl(var(--health-blue-light))] flex items-center justify-center animate-float" style={{ animationDelay: '500ms' }}>
          <span className="text-lg">🏔️</span>
        </div>
      </div>
      <p className="mt-5 text-body1 font-semibold text-[hsl(var(--health-blue))]">
        6m 이상 먼 곳을 바라보세요
      </p>
      <p className="text-caption1 text-muted-foreground mt-1">
        창밖 풍경이나 먼 물체에 초점을 맞추세요
      </p>
    </div>
  );
}

export function Timer2020({ onSessionComplete, onBack }: Timer2020Props) {
  const { haptic } = useAppsInToss();
  const { updateProgress, updateChallengeProgress } = useAchievements();

  const [phase, setPhase] = useState<'idle' | 'work' | 'rest' | 'complete'>('idle');
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);

  // 휴식 활동 관련
  const [restActivity, setRestActivity] = useState<RestActivity>('gazing');
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [blinkCount, setBlinkCount] = useState(0);

  // 세션 시작 시간
  const sessionStartRef = useRef<string | null>(null);

  // 호흡 가이드 로직
  useEffect(() => {
    if (phase !== 'rest' || restActivity !== 'breathing') return;

    let breathTime = 0;
    const interval = setInterval(() => {
      breathTime += 1;
      const cycleTime = breathTime % (BREATHING_CYCLE * 3);

      if (cycleTime < BREATHING_CYCLE) {
        setBreathingPhase('inhale');
      } else if (cycleTime < BREATHING_CYCLE * 2) {
        setBreathingPhase('hold');
      } else {
        setBreathingPhase('exhale');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, restActivity]);

  // 깜빡임 카운트
  useEffect(() => {
    if (phase !== 'rest' || restActivity !== 'blinking') return;

    const interval = setInterval(() => {
      setBlinkCount(prev => {
        if (prev >= 10) return 0;
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [phase, restActivity]);

  // 타이머 로직
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handlePhaseEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handlePhaseEnd = useCallback(async () => {
    // 강한 햄틱 피드백으로 단계 전환 알림
    await haptic('success');
    // 연속 햄틱으로 강조 (0.3초 후 한번 더)
    setTimeout(() => haptic('success'), 300);

    if (phase === 'work') {
      // 작업 완료 → 휴식 시작
      setPhase('rest');
      setTimeLeft(REST_TIME);
      setRestActivity('gazing');
      setBlinkCount(0);
    } else if (phase === 'rest') {
      // 휴식 완료 → 세션 종료
      setPhase('complete');
      setSessionsToday(prev => prev + 1);

      // 업적 및 챌린지 업데이트
      updateProgress('timerSessions', 1, true);
      updateChallengeProgress('timer', 1);

      onSessionComplete?.();
    }
  }, [phase, haptic, onSessionComplete, updateProgress, updateChallengeProgress]);

  const handleStart = async () => {
    await haptic('tap');
    sessionStartRef.current = new Date().toISOString();
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
    sessionStartRef.current = null;
  };

  const handleContinue = async () => {
    await haptic('tap');
    sessionStartRef.current = new Date().toISOString();
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

  // Eyeri 무드 결정
  const getEyeriMood = () => {
    if (phase === 'complete') return 'happy';
    if (phase === 'rest') return 'sleepy';
    if (phase === 'work' && timeLeft < 60) return 'cheering';
    return 'default';
  };

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 헤더 - Premium */}
      <div className="p-5">
        <div className="flex items-center justify-between animate-fade-in">
          <h2 className="text-title2 font-bold text-foreground">20-20-20 규칙</h2>
          {/* 오늘 세션 수 - Badge */}
          <div className="badge-stat-blue">
            <Sparkles className="w-3.5 h-3.5" />
            <span>오늘 {sessionsToday}회</span>
          </div>
        </div>
      </div>

      {/* 타이머 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6">
        {/* 휴식 시 가이드 활동 - Premium Card */}
        {phase === 'rest' && (
          <div className="w-full mb-6 animate-slide-up">
            {/* 활동 선택 탭 - Pill Tabs */}
            <div className="flex gap-2 mb-5 justify-center">
              {(['gazing', 'breathing', 'blinking'] as const).map((activity, index) => (
                <button
                  key={activity}
                  onClick={() => setRestActivity(activity)}
                  className={`
                    px-4 py-2 rounded-full text-caption1 font-semibold transition-all btn-touch
                    ${restActivity === activity
                      ? 'bg-[hsl(var(--health-green))] text-white shadow-md'
                      : 'bg-[hsl(var(--neutral-100))] text-[hsl(var(--neutral-600))] hover:bg-[hsl(var(--neutral-150))]'
                    }
                  `}
                  style={{ 
                    boxShadow: restActivity === activity ? 'var(--shadow-green)' : undefined,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {activity === 'gazing' && '원거리 응시'}
                  {activity === 'breathing' && '호흡'}
                  {activity === 'blinking' && '깜빡임'}
                </button>
              ))}
            </div>

            {/* 활동 가이드 - Glass Card */}
            <div className="card-glass bg-[hsl(var(--health-green-light)/0.5)] min-h-[180px] flex items-center justify-center">
              {restActivity === 'gazing' && <GazingGuide />}
              {restActivity === 'breathing' && <BreathingGuide phase={breathingPhase} />}
              {restActivity === 'blinking' && <BlinkingGuide count={blinkCount} />}
            </div>
          </div>
        )}

        {/* 유휴/완료 시 Eyeri */}
        {(phase === 'idle' || phase === 'complete') && (
          <div className="mb-6">
            <EyeriCharacter
              mood={getEyeriMood()}
              size="medium"
              message={
                phase === 'idle'
                  ? '눈 건강을 위해 타이머를 시작해보세요!'
                  : '잘했어요! 눈이 시원해졌죠?'
              }
            />
          </div>
        )}

        {/* 원형 타이머 (작업/휴식 중) */}
        {(phase === 'work' || phase === 'rest') && (
          <div className="relative w-56 h-56 mb-6">
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
                {phase === 'work' && '작업 중'}
                {phase === 'rest' && '눈 휴식'}
              </p>
              <p className="text-5xl font-black text-foreground">
                {formatTime(timeLeft)}
              </p>
              {phase === 'work' && timeLeft < 60 && (
                <p className="text-caption1 text-primary mt-1 animate-pulse">
                  곧 휴식 시간!
                </p>
              )}
            </div>
          </div>
        )}

        {/* 완료 시 통계 - Premium Hero Card */}
        {phase === 'complete' && (
          <div className="w-full max-w-sm card-hero-green animate-scale-in">
            <div className="flex items-center gap-4 mb-5">
              <div className="icon-container-lg bg-white/20 rounded-2xl backdrop-blur-sm">
                <Timer className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-title3 font-bold text-white">세션 완료!</p>
                <p className="text-body2 text-white/80">눈의 피로가 풀렸어요</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-caption1 text-white/70 mb-1">오늘 총 세션</p>
                <p className="text-number-md text-white">{sessionsToday}회</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-caption1 text-white/70 mb-1">휴식 시간</p>
                <p className="text-number-md text-white">{sessionsToday * 20}초</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 규칙 설명 (유휴/작업 중) - Premium Info Card */}
      {(phase === 'idle' || phase === 'work') && (
        <div className="px-5 mb-4">
          <div className="card-glass bg-[hsl(var(--health-blue-subtle))] p-4">
            <p className="text-caption1 text-[hsl(var(--neutral-600))] text-center leading-relaxed">
              <strong className="text-[hsl(var(--health-blue-dark))]">20-20-20 규칙:</strong> 20분마다 20초간 20피트(6m) 먼 곳을 바라보면 디지털 눈 피로를 예방합니다
            </p>
          </div>
        </div>
      )}

      {/* 버튼 영역 - Premium Buttons */}
      <div className="p-5 space-y-3">
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            className="btn-toss-primary w-full py-4 text-body1 flex items-center justify-center gap-2 btn-touch"
          >
            <Play className="w-5 h-5" /> 타이머 시작
          </button>
        )}

        {(phase === 'work' || phase === 'rest') && (
          <div className="flex gap-3">
            <button
              onClick={handleToggle}
              className={`flex-1 py-4 rounded-2xl font-bold text-body1 flex items-center justify-center gap-2 btn-touch
                         transition-all duration-150 ${
                isRunning
                  ? 'bg-[hsl(var(--health-amber))] text-white'
                  : 'btn-toss-primary'
              }`}
              style={{ 
                boxShadow: isRunning ? 'var(--shadow-md), 0 8px 24px -4px hsl(var(--health-amber) / 0.25)' : undefined
              }}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? '일시정지' : '재개'}
            </button>
            <button
              onClick={handleReset}
              className="py-4 px-6 rounded-2xl bg-[hsl(var(--neutral-100))] text-[hsl(var(--neutral-600))] font-bold btn-touch
                         transition-all duration-150
                         active:scale-[0.95] active:bg-[hsl(var(--neutral-200))]"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="space-y-3 animate-slide-up">
            <button
              onClick={handleContinue}
              className="btn-toss-success w-full py-4 text-body1 btn-touch"
            >
              한 번 더 하기
            </button>
            <button
              onClick={onBack}
              className="btn-toss-secondary w-full py-4 text-body1 btn-touch"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
