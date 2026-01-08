/**
 * 눈 운동 가이드 컴포넌트
 */

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Eye, Infinity, Circle, Focus } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { ExerciseType } from '../types';

interface EyeExerciseProps {
  onComplete?: () => void;
  onBack: () => void;
}

interface ExerciseInfo {
  id: ExerciseType;
  name: string;
  description: string;
  duration: number;
  icon: React.ReactNode;
}

const EXERCISES: ExerciseInfo[] = [
  {
    id: 'figure8',
    name: '8자 운동',
    description: '눈으로 8자를 따라 그리세요',
    duration: 30,
    icon: <Infinity className="w-6 h-6" />,
  },
  {
    id: 'circle',
    name: '원 운동',
    description: '눈으로 원을 그리세요',
    duration: 20,
    icon: <Circle className="w-6 h-6" />,
  },
  {
    id: 'blink',
    name: '깜빡임 훈련',
    description: '빠르게 눈을 깜빡이세요',
    duration: 15,
    icon: <Eye className="w-6 h-6" />,
  },
  {
    id: 'focus',
    name: '초점 훈련',
    description: '점을 따라 초점을 맞추세요',
    duration: 20,
    icon: <Focus className="w-6 h-6" />,
  },
];

function Figure8Animation({ isPlaying }: { isPlaying: boolean }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const angleRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      angleRef.current += 0.05;
      const t = angleRef.current;
      // 8자 모양 (리사주 곡선)
      const x = 50 + 35 * Math.sin(t);
      const y = 50 + 20 * Math.sin(2 * t);
      setPosition({ x, y });
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-secondary rounded-2xl overflow-hidden">
      {/* 8자 경로 */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <path
          d="M 50 30 C 85 30 85 70 50 70 C 15 70 15 30 50 30"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeDasharray="4"
        />
      </svg>
      {/* 추적 점 */}
      <div
        className="absolute w-6 h-6 bg-primary rounded-full shadow-lg transition-all duration-75"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

function CircleAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [position, setPosition] = useState({ x: 50, y: 20 });
  const angleRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      angleRef.current += 0.05;
      const x = 50 + 30 * Math.cos(angleRef.current);
      const y = 50 + 30 * Math.sin(angleRef.current);
      setPosition({ x, y });
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-secondary rounded-2xl overflow-hidden">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeDasharray="4"
        />
      </svg>
      <div
        className="absolute w-6 h-6 bg-primary rounded-full shadow-lg transition-all duration-75"
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

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setIsOpen(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-secondary rounded-2xl flex items-center justify-center">
      <div className="flex gap-8">
        <div className={`w-16 h-16 rounded-full bg-white border-4 border-foreground flex items-center justify-center transition-all duration-200 ${
          isOpen ? '' : 'scale-y-[0.1]'
        }`}>
          <div className="w-6 h-6 rounded-full bg-foreground" />
        </div>
        <div className={`w-16 h-16 rounded-full bg-white border-4 border-foreground flex items-center justify-center transition-all duration-200 ${
          isOpen ? '' : 'scale-y-[0.1]'
        }`}>
          <div className="w-6 h-6 rounded-full bg-foreground" />
        </div>
      </div>
      <p className="absolute bottom-4 text-caption1 text-muted-foreground">
        {isOpen ? '눈을 떠세요' : '눈을 감으세요'}
      </p>
    </div>
  );
}

function FocusAnimation({ isPlaying }: { isPlaying: boolean }) {
  const [size, setSize] = useState(10);
  const growingRef = useRef(true);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setSize(prev => {
        if (prev >= 40) growingRef.current = false;
        if (prev <= 10) growingRef.current = true;
        return growingRef.current ? prev + 1 : prev - 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-48 bg-secondary rounded-2xl flex items-center justify-center">
      <div
        className="rounded-full bg-primary transition-all duration-100"
        style={{ width: `${size}%`, height: `${size * 2}px` }}
      />
      <p className="absolute bottom-4 text-caption1 text-muted-foreground">
        점에 초점을 맞추세요
      </p>
    </div>
  );
}

export function EyeExercise({ onComplete, onBack }: EyeExerciseProps) {
  const { haptic } = useAppsInToss();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0].duration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const exercise = EXERCISES[currentExercise];

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
    
    if (currentExercise < EXERCISES.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeLeft(EXERCISES[currentExercise + 1].duration);
      setIsPlaying(true);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
      onComplete?.();
    }
  };

  const handleToggle = async () => {
    await haptic('tap');
    setIsPlaying(prev => !prev);
  };

  const handleReset = async () => {
    await haptic('tap');
    setTimeLeft(exercise.duration);
    setIsPlaying(false);
  };

  const renderAnimation = () => {
    switch (exercise.id) {
      case 'figure8':
        return <Figure8Animation isPlaying={isPlaying} />;
      case 'circle':
        return <CircleAnimation isPlaying={isPlaying} />;
      case 'blink':
        return <BlinkAnimation isPlaying={isPlaying} />;
      case 'focus':
        return <FocusAnimation isPlaying={isPlaying} />;
      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-14 h-14 text-success" />
        </div>
        
        <h2 className="text-title2 text-foreground mb-2">운동 완료!</h2>
        <p className="text-body2 text-muted-foreground mb-6">
          {EXERCISES.length}가지 눈 운동을 완료했습니다
        </p>

        <button
          onClick={onBack}
          className="btn-toss-primary w-full"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 진행 상태 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption1 text-muted-foreground">진행률</span>
          <span className="text-caption1 text-primary font-semibold">
            {currentExercise + 1} / {EXERCISES.length}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentExercise + 1) / EXERCISES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 운동 정보 */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {exercise.icon}
          </div>
          <div>
            <h3 className="text-body1 font-bold text-foreground">{exercise.name}</h3>
            <p className="text-caption1 text-muted-foreground">{exercise.description}</p>
          </div>
        </div>
      </div>

      {/* 애니메이션 영역 */}
      <div className="px-4 mb-6">
        {renderAnimation()}
      </div>

      {/* 타이머 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-black text-foreground">{timeLeft}</p>
          <p className="text-caption1 text-muted-foreground">초 남음</p>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="p-4">
        <div className="flex gap-3">
          <button
            onClick={handleToggle}
            className={`flex-1 py-4 rounded-2xl font-bold text-body1 flex items-center justify-center gap-2 ${
              isPlaying 
                ? 'bg-warning text-white' 
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isPlaying ? '일시정지' : '시작'}
          </button>
          <button
            onClick={handleReset}
            className="py-4 px-6 rounded-2xl bg-secondary text-muted-foreground font-bold"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
