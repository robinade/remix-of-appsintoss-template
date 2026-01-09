/**
 * Enhanced Eye Exercise Component with Course Selection
 * 다양한 눈 운동 코스와 개선된 애니메이션
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, CheckCircle2, Eye, Infinity, Circle, Focus,
  Zap, Target, Coffee, Gamepad2, Heart, Timer, ArrowLeft, Sparkles,
  HandMetal, Wind, Mountain, Glasses
} from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { ExerciseType, ExerciseCourse, ExerciseInfo } from '../types';

interface EyeExerciseProps {
  onComplete?: () => void;
  onBack: () => void;
}

// 전체 운동 정보 데이터베이스
const EXERCISE_DATABASE: Record<ExerciseType, ExerciseInfo> = {
  'figure8': {
    id: 'figure8',
    name: '8자 운동',
    nameEn: 'Figure 8',
    description: '눈으로 8자를 따라 그리세요',
    duration: 30,
    instructions: ['화면의 점을 눈으로 따라가세요', '머리는 고정하고 눈만 움직이세요'],
    benefits: ['안구 근육 이완', '눈의 유연성 향상'],
    category: 'flexibility'
  },
  'circle': {
    id: 'circle',
    name: '원 운동',
    nameEn: 'Circle Motion',
    description: '눈으로 원을 그리세요',
    duration: 20,
    instructions: ['천천히 원을 그리듯 눈을 돌리세요', '시계방향, 반시계방향 번갈아 실행'],
    benefits: ['안구 근육 강화', '눈의 순환 개선'],
    category: 'flexibility'
  },
  'blink': {
    id: 'blink',
    name: '빠른 깜빡임',
    nameEn: 'Quick Blink',
    description: '빠르게 눈을 깜빡이세요',
    duration: 15,
    instructions: ['빠르게 10번 깜빡이세요', '눈물막을 재생성합니다'],
    benefits: ['안구 건조 완화', '눈물 분비 촉진'],
    category: 'strain-relief'
  },
  'focus': {
    id: 'focus',
    name: '초점 훈련',
    nameEn: 'Focus Training',
    description: '움직이는 점에 초점을 맞추세요',
    duration: 20,
    instructions: ['점의 크기가 변해도 초점을 유지하세요', '깊이감을 느껴보세요'],
    benefits: ['초점 조절력 강화', '수정체 유연성 향상'],
    category: 'flexibility'
  },
  'near-far': {
    id: 'near-far',
    name: '원근 초점 전환',
    nameEn: 'Near-Far Focus',
    description: '가까운 곳과 먼 곳을 번갈아 보세요',
    duration: 30,
    instructions: [
      '화면이 "가까이"면 화면에 초점',
      '화면이 "멀리"면 창밖이나 6m 이상 떨어진 곳을 보세요'
    ],
    benefits: ['조절 근육 훈련', '원근 전환 능력 향상', '눈의 피로 감소'],
    category: 'convergence'
  },
  'palming': {
    id: 'palming',
    name: '팜밍',
    nameEn: 'Palming',
    description: '손바닥으로 눈을 가리고 휴식하세요',
    duration: 60,
    instructions: [
      '손바닥을 비벼 따뜻하게 하세요',
      '컵 모양으로 눈을 가리세요',
      '눈을 감고 어둠 속에서 휴식하세요'
    ],
    benefits: ['눈 근육 완전 이완', '스트레스 해소', '눈의 피로 회복'],
    category: 'relaxation'
  },
  'pencil-pushup': {
    id: 'pencil-pushup',
    name: '수렴 운동',
    nameEn: 'Pencil Push-up',
    description: '점이 가까이 올 때 두 눈으로 초점을 맞추세요',
    duration: 30,
    instructions: [
      '점이 멀리서 가까이 오는 것을 따라가세요',
      '점이 하나로 보이도록 초점을 맞추세요',
      '흐려지면 다시 멀리서 시작합니다'
    ],
    benefits: ['수렴 능력 강화', '양안 협응력 향상', '눈 정렬 개선'],
    category: 'convergence'
  },
  'peripheral': {
    id: 'peripheral',
    name: '주변 시야 확장',
    nameEn: 'Peripheral Vision',
    description: '중앙을 보면서 주변의 움직임을 감지하세요',
    duration: 25,
    instructions: [
      '중앙의 점을 계속 응시하세요',
      '주변에서 나타나는 움직임을 감지하세요',
      '머리를 돌리지 말고 눈만 사용하세요'
    ],
    benefits: ['주변 시야 강화', '시야 범위 확장', '반응 속도 향상'],
    category: 'flexibility'
  },
  'distance-gaze': {
    id: 'distance-gaze',
    name: '원거리 응시',
    nameEn: 'Distance Gaze',
    description: '화면에서 눈을 떼고 멀리 바라보세요',
    duration: 20,
    instructions: [
      '화면에서 눈을 떼세요',
      '창밖이나 6m 이상 떨어진 곳을 바라보세요',
      '편안하게 호흡하며 시선을 유지하세요'
    ],
    benefits: ['눈 피로 해소', '조절 근육 이완', '근시 예방'],
    category: 'strain-relief'
  },
  'slow-blink': {
    id: 'slow-blink',
    name: '천천히 깜빡이기',
    nameEn: 'Slow Blink',
    description: '2초 동안 눈을 감았다가 천천히 뜨세요',
    duration: 30,
    instructions: [
      '2초 동안 천천히 눈을 감으세요',
      '2초 동안 유지하세요',
      '2초 동안 천천히 뜨세요'
    ],
    benefits: ['완전한 눈물막 재생성', '안구 건조 완화', '눈 휴식'],
    category: 'relaxation'
  },
  'massage-guide': {
    id: 'massage-guide',
    name: '눈 주변 마사지',
    nameEn: 'Eye Massage',
    description: '눈 주변을 부드럽게 마사지하세요',
    duration: 45,
    instructions: [
      '눈썹 뼈를 따라 안쪽에서 바깥쪽으로 누르세요',
      '관자놀이를 원을 그리며 마사지하세요',
      '눈 아래 뼈를 따라 부드럽게 누르세요'
    ],
    benefits: ['혈액순환 개선', '긴장 완화', '눈 피로 해소'],
    category: 'relaxation'
  },
  'breathing': {
    id: 'breathing',
    name: '눈 휴식 호흡',
    nameEn: 'Eye Rest Breathing',
    description: '깊은 호흡과 함께 눈을 휴식시키세요',
    duration: 40,
    instructions: [
      '눈을 감고 4초 들이쉬기',
      '4초 동안 숨 참기',
      '4초 동안 내쉬기',
      '눈과 몸의 긴장을 풀어주세요'
    ],
    benefits: ['산소 공급 증가', '스트레스 해소', '전체적인 이완'],
    category: 'relaxation'
  }
};

// 운동 코스 정의
const EXERCISE_COURSES: ExerciseCourse[] = [
  {
    id: 'quick-relief',
    name: '빠른 눈 피로 해소',
    nameEn: 'Quick Relief',
    description: '바쁜 일상 중 2분 만에 눈 피로를 해소하세요',
    duration: '2분',
    durationSeconds: 120,
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
    exercises: ['blink', 'distance-gaze', 'slow-blink'],
    difficulty: 'easy',
    category: 'relief'
  },
  {
    id: 'focus-training',
    name: '초점 훈련 코스',
    nameEn: 'Focus Training',
    description: '눈의 초점 조절 능력을 강화하는 집중 훈련',
    duration: '5분',
    durationSeconds: 300,
    icon: '🎯',
    color: 'from-blue-400 to-indigo-600',
    exercises: ['near-far', 'pencil-pushup', 'focus', 'circle'],
    difficulty: 'medium',
    category: 'training'
  },
  {
    id: 'full-workout',
    name: '종합 눈 운동',
    nameEn: 'Full Workout',
    description: '모든 눈 운동을 포함한 완벽한 종합 코스',
    duration: '10분',
    durationSeconds: 600,
    icon: '💪',
    color: 'from-green-400 to-emerald-600',
    exercises: ['figure8', 'circle', 'blink', 'near-far', 'focus', 'palming'],
    difficulty: 'hard',
    category: 'training'
  },
  {
    id: 'relaxation',
    name: '눈 릴렉스 코스',
    nameEn: 'Eye Relaxation',
    description: '눈과 마음을 편안하게 이완시키는 힐링 코스',
    duration: '7분',
    durationSeconds: 420,
    icon: '🧘',
    color: 'from-purple-400 to-pink-500',
    exercises: ['palming', 'slow-blink', 'breathing', 'massage-guide'],
    difficulty: 'easy',
    category: 'relaxation'
  },
  {
    id: 'gamer-mode',
    name: '게이머 눈 케어',
    nameEn: 'Gamer Eye Care',
    description: '게임/작업 후 지친 눈을 위한 집중 케어',
    duration: '3분',
    durationSeconds: 180,
    icon: '🎮',
    color: 'from-red-400 to-rose-600',
    exercises: ['blink', 'peripheral', 'distance-gaze', 'slow-blink'],
    difficulty: 'easy',
    category: 'gamer'
  }
];

// 아이콘 매핑
const getExerciseIcon = (exerciseId: ExerciseType) => {
  const icons: Record<ExerciseType, React.ReactNode> = {
    'figure8': <Infinity className="w-6 h-6" />,
    'circle': <Circle className="w-6 h-6" />,
    'blink': <Eye className="w-6 h-6" />,
    'focus': <Focus className="w-6 h-6" />,
    'near-far': <Glasses className="w-6 h-6" />,
    'palming': <HandMetal className="w-6 h-6" />,
    'pencil-pushup': <Target className="w-6 h-6" />,
    'peripheral': <Sparkles className="w-6 h-6" />,
    'distance-gaze': <Mountain className="w-6 h-6" />,
    'slow-blink': <Timer className="w-6 h-6" />,
    'massage-guide': <Heart className="w-6 h-6" />,
    'breathing': <Wind className="w-6 h-6" />
  };
  return icons[exerciseId] || <Eye className="w-6 h-6" />;
};

// 애니메이션 컴포넌트들
function Figure8Animation({ isPlaying }: { isPlaying: boolean }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [trail, setTrail] = useState<{x: number, y: number}[]>([]);
  const angleRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      angleRef.current += 0.05;
      const t = angleRef.current;
      const x = 50 + 35 * Math.sin(t);
      const y = 50 + 20 * Math.sin(2 * t);
      setPosition({ x, y });
      setTrail(prev => [...prev.slice(-15), { x, y }]);
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl overflow-hidden">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <path
          d="M 50 30 C 85 30 85 70 50 70 C 15 70 15 30 50 30"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4"
          opacity="0.5"
        />
        {/* 트레일 효과 */}
        {trail.map((pos, i) => (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={2 + i * 0.2}
            fill="hsl(var(--primary))"
            opacity={0.1 + (i / trail.length) * 0.5}
          />
        ))}
      </svg>
      <div
        className="absolute w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full shadow-lg shadow-primary/30 transition-all duration-75 flex items-center justify-center"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    </div>
  );
}

function CircleAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [position, setPosition] = useState({ x: 50, y: 20 });
  const [pulse, setPulse] = useState(1);
  const angleRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      angleRef.current += 0.05;
      const x = 50 + 30 * Math.cos(angleRef.current);
      const y = 50 + 30 * Math.sin(angleRef.current);
      setPosition({ x, y });
      setPulse(1 + 0.2 * Math.sin(angleRef.current * 3));
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl overflow-hidden">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4"
          opacity="0.5"
        />
        {/* 중앙 펄싱 포인트 */}
        <circle
          cx="50"
          cy="50"
          r={4 * pulse}
          fill="hsl(var(--primary))"
          opacity="0.3"
        />
      </svg>
      <div
        className="absolute w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full shadow-lg shadow-primary/30 transition-all duration-75"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

function BlinkAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  const [blinkCount, setBlinkCount] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setIsOpen(prev => {
        if (prev) setBlinkCount(c => c + 1);
        return !prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl flex flex-col items-center justify-center gap-4">
      <div className="flex gap-8">
        {/* 귀여운 눈 캐릭터 */}
        <div className={`relative w-20 h-20 rounded-full bg-white border-4 border-foreground/80 flex items-center justify-center transition-all duration-200 ${
          isOpen ? '' : 'scale-y-[0.1]'
        }`}>
          <div className="w-8 h-8 rounded-full bg-foreground relative">
            {isOpen && (
              <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white" />
            )}
          </div>
          {/* 속눈썹 */}
          {!isOpen && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-0.5 h-3 bg-foreground/60 rounded-full"
                  style={{ transform: `rotate(${(i - 2) * 15}deg)` }} />
              ))}
            </div>
          )}
        </div>
        <div className={`relative w-20 h-20 rounded-full bg-white border-4 border-foreground/80 flex items-center justify-center transition-all duration-200 ${
          isOpen ? '' : 'scale-y-[0.1]'
        }`}>
          <div className="w-8 h-8 rounded-full bg-foreground relative">
            {isOpen && (
              <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white" />
            )}
          </div>
          {!isOpen && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-0.5 h-3 bg-foreground/60 rounded-full"
                  style={{ transform: `rotate(${(i - 2) * 15}deg)` }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-body1 font-bold text-foreground">
          {isOpen ? '👀 눈을 떠세요' : '😌 눈을 감으세요'}
        </p>
        <p className="text-caption1 text-muted-foreground mt-1">
          깜빡임 횟수: {blinkCount}회
        </p>
      </div>
    </div>
  );
}

function FocusAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [size, setSize] = useState(15);
  const growingRef = useRef(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSize(prev => {
        if (prev >= 50) growingRef.current = false;
        if (prev <= 15) growingRef.current = true;
        return growingRef.current ? prev + 0.8 : prev - 0.8;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl flex items-center justify-center overflow-hidden">
      {/* 배경 원형 링들 */}
      {[60, 70, 80, 90].map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-border/30"
          style={{ width: `${s}%`, height: `${s}%` }}
        />
      ))}
      {/* 메인 포커스 점 */}
      <div
        className="rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/40 transition-all duration-100 flex items-center justify-center"
        style={{ width: `${size}%`, height: `${size}%` }}
      >
        <div className="w-3 h-3 bg-white rounded-full" />
      </div>
      <p className="absolute bottom-4 text-caption1 text-muted-foreground">
        점에 초점을 맞추세요
      </p>
    </div>
  );
}

function NearFarAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [phase, setPhase] = useState<'near' | 'far'>('near');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setPhase(p => p === 'near' ? 'far' : 'near');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`relative w-full h-48 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${
      phase === 'near'
        ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/30'
        : 'bg-gradient-to-br from-green-500/20 to-emerald-600/30'
    }`}>
      <div className={`transition-all duration-500 ${
        phase === 'near' ? 'scale-150' : 'scale-50 opacity-50'
      }`}>
        {phase === 'near' ? (
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">📱</span>
          </div>
        ) : (
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏔️</span>
          </div>
        )}
      </div>
      <div className="mt-6 text-center">
        <p className="text-title2 font-bold text-foreground">
          {phase === 'near' ? '👁️ 가까이' : '👁️ 멀리'}
        </p>
        <p className="text-body2 text-muted-foreground">
          {phase === 'near' ? '화면에 초점을 맞추세요' : '창밖 멀리를 바라보세요'}
        </p>
        <p className="text-caption1 text-primary mt-2">{countdown}초 후 전환</p>
      </div>
    </div>
  );
}

function PalmingAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [step, setStep] = useState(0);
  const steps = [
    { text: '손바닥을 10번 비벼 따뜻하게 하세요', emoji: '🙌' },
    { text: '컵 모양으로 손을 만드세요', emoji: '🤲' },
    { text: '눈을 감고 손바닥으로 눈을 덮으세요', emoji: '😌' },
    { text: '어둠 속에서 깊게 호흡하세요', emoji: '🌙' },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex flex-col items-center justify-center">
      <div className="text-6xl mb-4 animate-pulse">{steps[step].emoji}</div>
      <p className="text-body1 font-medium text-foreground text-center px-4">
        {steps[step].text}
      </p>
      <div className="flex gap-1 mt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PencilPushupAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [distance, setDistance] = useState(100);
  const goingInRef = useRef(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setDistance(prev => {
        if (prev <= 20) goingInRef.current = false;
        if (prev >= 100) goingInRef.current = true;
        return goingInRef.current ? prev - 2 : prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const scale = 0.3 + (100 - distance) * 0.015;

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl flex items-center justify-center overflow-hidden">
      {/* 깊이감 표현 배경 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-border/20"
            style={{
              width: `${20 + i * 15}%`,
              height: `${20 + i * 15}%`,
            }}
          />
        ))}
      </div>
      {/* 메인 타겟 */}
      <div
        className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-xl flex items-center justify-center transition-transform duration-75"
        style={{ transform: `scale(${scale})` }}
      >
        <Target className="w-6 h-6 text-white" />
      </div>
      <p className="absolute bottom-4 text-caption1 text-muted-foreground">
        점이 하나로 보이도록 초점을 맞추세요
      </p>
    </div>
  );
}

function PeripheralAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [activeSpot, setActiveSpot] = useState<number | null>(null);
  const spots = [
    { x: 10, y: 20 }, { x: 90, y: 20 },
    { x: 10, y: 80 }, { x: 90, y: 80 },
    { x: 50, y: 10 }, { x: 50, y: 90 },
    { x: 20, y: 50 }, { x: 80, y: 50 }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveSpot(Math.floor(Math.random() * spots.length));
      setTimeout(() => setActiveSpot(null), 300);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl overflow-hidden">
      {/* 중앙 고정점 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
      {/* 주변 스팟들 */}
      {spots.map((spot, i) => (
        <div
          key={i}
          className={`absolute w-4 h-4 rounded-full transition-all duration-200 ${
            activeSpot === i
              ? 'bg-yellow-400 scale-150 shadow-lg shadow-yellow-400/50'
              : 'bg-muted-foreground/20'
          }`}
          style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption1 text-muted-foreground">
        중앙을 보며 주변 움직임 감지
      </p>
    </div>
  );
}

function DistanceGazeAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setShowReminder(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-sky-400/30 to-emerald-400/30 rounded-2xl flex flex-col items-center justify-center">
      <div className="text-6xl mb-2">🏔️</div>
      <p className="text-title2 font-bold text-foreground">창밖을 바라보세요</p>
      <p className="text-body2 text-muted-foreground">6m 이상 떨어진 곳</p>
      {showReminder && (
        <p className="text-caption1 text-primary mt-4 animate-pulse">
          편안하게 호흡하세요...
        </p>
      )}
    </div>
  );
}

function SlowBlinkAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [phase, setPhase] = useState<'open' | 'closing' | 'closed' | 'opening'>('open');
  const [eyeScale, setEyeScale] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;

    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setPhase('closing');
      setEyeScale(1);

      const closeInterval = setInterval(() => {
        setEyeScale(prev => Math.max(0.05, prev - 0.15));
      }, 100);

      timeout = setTimeout(() => {
        clearInterval(closeInterval);
        setPhase('closed');

        timeout = setTimeout(() => {
          setPhase('opening');
          const openInterval = setInterval(() => {
            setEyeScale(prev => {
              if (prev >= 1) {
                clearInterval(openInterval);
                setPhase('open');
                return 1;
              }
              return prev + 0.15;
            });
          }, 100);

          timeout = setTimeout(cycle, 2000);
        }, 2000);
      }, 1500);
    };

    timeout = setTimeout(cycle, 1000);
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const getMessage = () => {
    switch (phase) {
      case 'closing': return '천천히 눈을 감으세요...';
      case 'closed': return '편안하게 유지하세요';
      case 'opening': return '천천히 눈을 뜨세요...';
      default: return '깊게 호흡하세요';
    }
  };

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex flex-col items-center justify-center">
      <div className="flex gap-6">
        {[0, 1].map(i => (
          <div
            key={i}
            className="w-16 h-16 rounded-full bg-white border-4 border-foreground/70 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `scaleY(${eyeScale})` }}
          >
            {eyeScale > 0.3 && (
              <div className="w-6 h-6 rounded-full bg-foreground">
                <div className="w-2 h-2 bg-white rounded-full ml-1 mt-1" />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-body1 font-medium text-foreground mt-6">{getMessage()}</p>
    </div>
  );
}

function MassageGuideAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [step, setStep] = useState(0);
  const massageSteps = [
    { area: '눈썹 위', direction: '안쪽 → 바깥쪽', emoji: '👆' },
    { area: '관자놀이', direction: '원을 그리며', emoji: '👈' },
    { area: '눈 아래', direction: '코 → 귀 방향', emoji: '👇' },
    { area: '미간', direction: '위아래로', emoji: '☝️' },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % massageSteps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-2xl flex flex-col items-center justify-center">
      <div className="text-5xl mb-3">{massageSteps[step].emoji}</div>
      <p className="text-body1 font-bold text-foreground">{massageSteps[step].area}</p>
      <p className="text-body2 text-muted-foreground">{massageSteps[step].direction}</p>
      <p className="text-caption1 text-primary mt-3">부드럽게 마사지하세요</p>
      <div className="flex gap-1 mt-3">
        {massageSteps.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  );
}

function BreathingAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [scale, setScale] = useState(1);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setPhase(p => {
            if (p === 'inhale') return 'hold';
            if (p === 'hold') return 'exhale';
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (phase === 'inhale') setScale(1.3);
    else if (phase === 'hold') setScale(1.3);
    else setScale(1);
  }, [phase]);

  const getInstruction = () => {
    switch (phase) {
      case 'inhale': return '들이쉬기';
      case 'hold': return '참기';
      case 'exhale': return '내쉬기';
    }
  };

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-2xl flex flex-col items-center justify-center">
      <div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg transition-transform duration-1000"
        style={{ transform: `scale(${scale})` }}
      >
        <span className="text-3xl text-white font-bold">{countdown}</span>
      </div>
      <p className="text-title2 font-bold text-foreground mt-4">{getInstruction()}</p>
      <p className="text-caption1 text-muted-foreground">4-4-4 호흡법</p>
    </div>
  );
}

// 코스 선택 화면 - Premium Design
function CourseSelection({ onSelectCourse }: { onSelectCourse: (course: ExerciseCourse) => void }) {
  const { haptic } = useAppsInToss();

  const handleSelect = async (course: ExerciseCourse) => {
    await haptic('tap');
    onSelectCourse(course);
  };

  const getCategoryLabel = (category: ExerciseCourse['category']) => {
    const labels = {
      relief: '피로 해소',
      training: '훈련',
      relaxation: '릴렉스',
      gamer: '게이머'
    };
    return labels[category];
  };

  const getDifficultyStyles = (difficulty: ExerciseCourse['difficulty']) => {
    const styles = {
      easy: 'bg-[hsl(var(--health-green-light))] text-[hsl(var(--health-green-dark))]',
      medium: 'bg-[hsl(var(--health-amber-light))] text-[hsl(var(--health-amber))]',
      hard: 'bg-[hsl(var(--health-coral-light))] text-[hsl(var(--health-coral))]'
    };
    return styles[difficulty];
  };

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 헤더 - Premium Hero */}
      <div className="card-hero mx-0 rounded-none p-6 pb-8">
        <h2 className="text-title1 font-bold mb-2">눈 운동 코스</h2>
        <p className="text-body2 text-white/80">
          목적에 맞는 코스를 선택하세요
        </p>
      </div>

      {/* 코스 목록 - Premium Cards */}
      <div className="flex-1 p-5 space-y-4 -mt-4">
        {EXERCISE_COURSES.map((course, index) => (
          <button
            key={course.id}
            onClick={() => handleSelect(course)}
            className="w-full card-elevated p-5 text-left group animate-slide-up btn-touch"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* 아이콘 - Premium Icon Container */}
              <div className={`icon-container-lg rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-2xl`}
                   style={{ boxShadow: 'var(--shadow-md)' }}>
                {course.icon}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="text-body1 font-bold text-foreground group-hover:text-[hsl(var(--health-blue))] transition-colors">
                    {course.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-caption2 font-semibold ${getDifficultyStyles(course.difficulty)}`}>
                    {course.difficulty === 'easy' ? '쉬움' : course.difficulty === 'medium' ? '보통' : '어려움'}
                  </span>
                </div>
                <p className="text-caption1 text-[hsl(var(--neutral-500))] mb-3 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-3 text-caption1 flex-wrap">
                  <span className="badge-stat-blue">
                    <Timer className="w-3 h-3" />
                    {course.duration}
                  </span>
                  <span className="text-[hsl(var(--neutral-500))]">
                    {course.exercises.length}가지 운동
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[hsl(var(--neutral-100))] text-[hsl(var(--neutral-600))] font-medium">
                    {getCategoryLabel(course.category)}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 메인 컴포넌트
export function EyeExercise({ onComplete, onBack }: EyeExerciseProps) {
  const { haptic } = useAppsInToss();
  const [selectedCourse, setSelectedCourse] = useState<ExerciseCourse | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // 현재 운동 정보
  const currentExerciseId = selectedCourse?.exercises[currentExerciseIndex];
  const currentExercise = currentExerciseId ? EXERCISE_DATABASE[currentExerciseId] : null;
  const totalExercises = selectedCourse?.exercises.length || 0;

  // 코스 선택 시 초기화
  useEffect(() => {
    if (selectedCourse && currentExercise) {
      setTimeLeft(currentExercise.duration);
      setShowInstructions(true);
    }
  }, [selectedCourse, currentExerciseIndex]);

  // 타이머 로직
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      handleExerciseComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timeLeft]);

  const handleExerciseComplete = async () => {
    await haptic('success');

    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setIsPlaying(false);
      setShowInstructions(true);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
      onComplete?.();
    }
  };

  const handleStart = async () => {
    await haptic('tap');
    setShowInstructions(false);
    setIsPlaying(true);
  };

  const handleToggle = async () => {
    await haptic('tap');
    setIsPlaying(prev => !prev);
  };

  const handleReset = async () => {
    await haptic('tap');
    if (currentExercise) {
      setTimeLeft(currentExercise.duration);
      setIsPlaying(false);
    }
  };

  const handleBackToCourses = async () => {
    await haptic('tap');
    setSelectedCourse(null);
    setCurrentExerciseIndex(0);
    setIsPlaying(false);
    setIsComplete(false);
  };

  // 애니메이션 렌더링
  const renderAnimation = () => {
    if (!currentExerciseId) return null;

    const animations: Record<ExerciseType, React.ReactNode> = {
      'figure8': <Figure8Animation isPlaying={isPlaying} />,
      'circle': <CircleAnimation isPlaying={isPlaying} />,
      'blink': <BlinkAnimation isPlaying={isPlaying} />,
      'focus': <FocusAnimation isPlaying={isPlaying} />,
      'near-far': <NearFarAnimation isPlaying={isPlaying} />,
      'palming': <PalmingAnimation isPlaying={isPlaying} />,
      'pencil-pushup': <PencilPushupAnimation isPlaying={isPlaying} />,
      'peripheral': <PeripheralAnimation isPlaying={isPlaying} />,
      'distance-gaze': <DistanceGazeAnimation isPlaying={isPlaying} />,
      'slow-blink': <SlowBlinkAnimation isPlaying={isPlaying} />,
      'massage-guide': <MassageGuideAnimation isPlaying={isPlaying} />,
      'breathing': <BreathingAnimation isPlaying={isPlaying} />
    };

    return animations[currentExerciseId];
  };

  // 코스 미선택 시
  if (!selectedCourse) {
    return (
      <div>
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-body1 font-bold">눈 운동</h1>
        </div>
        <CourseSelection onSelectCourse={setSelectedCourse} />
      </div>
    );
  }

  // 완료 화면 - Premium Celebration
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 animate-fade-in">
        {/* Success Icon with Glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-[hsl(var(--health-green))] blur-2xl opacity-30 animate-pulse-soft" />
          <div className="relative icon-container bg-[hsl(var(--health-green-light))] rounded-full w-28 h-28 flex items-center justify-center animate-scale-in">
            <CheckCircle2 className="w-14 h-14 text-[hsl(var(--health-green))]" />
          </div>
        </div>

        <h2 className="text-title1 text-foreground mb-2 animate-slide-up">코스 완료!</h2>
        <p className="text-body1 text-[hsl(var(--neutral-600))] mb-3 animate-slide-up stagger-1">
          {selectedCourse.name}을 완료했습니다
        </p>
        <div className="badge-stat-green mb-8 animate-slide-up stagger-2">
          <Sparkles className="w-3.5 h-3.5" />
          {totalExercises}가지 운동 • {selectedCourse.duration}
        </div>

        <div className="flex gap-3 w-full animate-slide-up stagger-3">
          <button
            onClick={handleBackToCourses}
            className="btn-toss-secondary flex-1 py-4 btn-touch"
          >
            다른 코스
          </button>
          <button
            onClick={onBack}
            className="btn-toss-success flex-1 py-4 btn-touch"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  // 운동 진행 화면 - Premium Design
  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 헤더 - Premium */}
      <div className="flex items-center gap-3 p-4 border-b border-[hsl(var(--neutral-200)/0.6)] bg-white/80 backdrop-blur-xl sticky top-0 z-10"
           style={{ boxShadow: 'var(--shadow-sm)' }}>
        <button onClick={handleBackToCourses} className="w-11 h-11 rounded-2xl bg-[hsl(var(--neutral-100))] flex items-center justify-center btn-touch
                   transition-all duration-150
                   active:scale-95 active:bg-[hsl(var(--neutral-200))]">
          <ArrowLeft className="w-5 h-5 text-[hsl(var(--neutral-700))]" />
        </button>
        <div className="flex-1">
          <h1 className="text-title3 text-foreground">{selectedCourse.name}</h1>
          <p className="text-caption1 text-[hsl(var(--neutral-500))]">
            {currentExerciseIndex + 1} / {totalExercises}
          </p>
        </div>
      </div>

      {/* 진행 상태 - Premium Progress Bar */}
      <div className="px-5 py-4">
        <div className="h-2.5 bg-[hsl(var(--neutral-150))] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%`,
              background: 'linear-gradient(135deg, hsl(var(--health-blue)) 0%, hsl(var(--health-green)) 100%)'
            }}
          />
        </div>
      </div>

      {/* 운동 정보 - Premium Card */}
      {currentExercise && (
        <div className="px-5 mb-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="icon-container-lg icon-gradient-blue rounded-2xl text-[hsl(var(--health-blue))]">
              {getExerciseIcon(currentExercise.id)}
            </div>
            <div className="flex-1">
              <h3 className="text-body1 font-bold text-foreground">{currentExercise.name}</h3>
              <p className="text-caption1 text-[hsl(var(--neutral-500))]">{currentExercise.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* 애니메이션 또는 설명 영역 - Premium */}
      <div className="px-5 mb-6">
        {showInstructions && currentExercise ? (
          <div className="w-full min-h-[200px] card-glass bg-[hsl(var(--health-blue-subtle))] p-5 flex flex-col justify-center animate-slide-up">
            <h4 className="text-body1 font-bold text-foreground mb-4">운동 방법</h4>
            <ul className="space-y-3">
              {currentExercise.instructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-3 text-body2 text-[hsl(var(--neutral-600))] animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="w-6 h-6 rounded-full bg-[hsl(var(--health-blue))] text-white text-caption1 font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          renderAnimation()
        )}
      </div>

      {/* 타이머 - Premium Number Display */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-number-xl text-foreground">{timeLeft}</p>
          <p className="text-caption1 text-[hsl(var(--neutral-500))] mt-1">초 남음</p>
        </div>
      </div>

      {/* 컨트롤 버튼 - Premium */}
      <div className="p-5">
        {showInstructions ? (
          <button
            onClick={handleStart}
            className="btn-toss-primary w-full py-4 text-body1 flex items-center justify-center gap-2 btn-touch"
          >
            <Play className="w-5 h-5" />
            운동 시작
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleToggle}
              className={`flex-1 py-4 rounded-2xl font-bold text-body1 flex items-center justify-center gap-2 btn-touch
                         transition-all duration-150 ${
                isPlaying
                  ? 'bg-[hsl(var(--health-amber))] text-white'
                  : 'btn-toss-primary'
              }`}
              style={{ 
                boxShadow: isPlaying ? 'var(--shadow-md), 0 8px 24px -4px hsl(var(--health-amber) / 0.25)' : undefined
              }}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? '일시정지' : '계속'}
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
      </div>
    </div>
  );
}
