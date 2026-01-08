/**
 * 색약 테스트 컴포넌트
 * 이시하라 스타일 테스트
 */

import { useState } from 'react';
import { CheckCircle2, Palette, ArrowRight } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';

interface ColorBlindTestProps {
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

// 색약 테스트 플레이트 데이터
const PLATES = [
  { 
    id: 1, 
    answer: '12',
    bgColor: 'hsl(120, 40%, 50%)',
    dotColor: 'hsl(0, 60%, 50%)',
    description: '숫자가 보이시나요?'
  },
  { 
    id: 2, 
    answer: '8',
    bgColor: 'hsl(30, 60%, 60%)',
    dotColor: 'hsl(200, 60%, 50%)',
    description: '숫자가 보이시나요?'
  },
  { 
    id: 3, 
    answer: '6',
    bgColor: 'hsl(350, 50%, 55%)',
    dotColor: 'hsl(120, 50%, 45%)',
    description: '숫자가 보이시나요?'
  },
  { 
    id: 4, 
    answer: '29',
    bgColor: 'hsl(140, 45%, 50%)',
    dotColor: 'hsl(20, 70%, 55%)',
    description: '숫자가 보이시나요?'
  },
  { 
    id: 5, 
    answer: '57',
    bgColor: 'hsl(45, 60%, 55%)',
    dotColor: 'hsl(280, 50%, 50%)',
    description: '숫자가 보이시나요?'
  },
];

// 컬러 원판 컴포넌트
function ColorPlate({ bgColor, dotColor, answer }: { bgColor: string; dotColor: string; answer: string }) {
  // 랜덤 도트 생성
  const dots = [];
  for (let i = 0; i < 200; i++) {
    const x = 10 + Math.random() * 80;
    const y = 10 + Math.random() * 80;
    const size = 3 + Math.random() * 8;
    
    // 숫자 영역 판별 (간단한 시뮬레이션)
    const isInNumber = checkIfInNumber(x, y, answer);
    
    dots.push({
      x,
      y,
      size,
      color: isInNumber ? dotColor : bgColor,
    });
  }

  return (
    <div className="relative w-64 h-64 rounded-full overflow-hidden shadow-lg">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="hsl(var(--secondary))" />
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.size / 2}
            fill={dot.color}
            opacity={0.9}
          />
        ))}
      </svg>
    </div>
  );
}

// 숫자 영역 체크 (간단한 로직)
function checkIfInNumber(x: number, y: number, answer: string): boolean {
  const cx = 50;
  const cy = 50;
  const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  
  // 중앙 근처에 숫자가 있다고 가정
  if (distance < 25) {
    // 숫자 패턴에 따라 다른 영역
    const angle = Math.atan2(y - cy, x - cx);
    const normalized = (angle + Math.PI) / (2 * Math.PI);
    
    // 간단한 패턴 매칭
    if (answer === '12') return normalized > 0.2 && normalized < 0.8;
    if (answer === '8') return distance < 20;
    if (answer === '6') return x > 40 && x < 60;
    if (answer === '29') return y > 35 && y < 65;
    if (answer === '57') return (x + y) % 20 < 10;
    
    return distance < 15;
  }
  return false;
}

export function ColorBlindTest({ onComplete, onBack }: ColorBlindTestProps) {
  const { haptic } = useAppsInToss();
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async () => {
    await haptic('tap');
    
    const newAnswers = [...answers, inputValue];
    setAnswers(newAnswers);
    setInputValue('');

    if (stage < PLATES.length - 1) {
      setStage(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleSkip = async () => {
    await haptic('tap');
    const newAnswers = [...answers, ''];
    setAnswers(newAnswers);
    setInputValue('');

    if (stage < PLATES.length - 1) {
      setStage(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const score = answers.filter((ans, i) => 
    ans.toLowerCase() === PLATES[i].answer.toLowerCase()
  ).length;

  if (isComplete) {
    const percentage = (score / PLATES.length) * 100;
    const diagnosis = percentage >= 80 ? '정상' : 
                      percentage >= 60 ? '경미한 색각 이상 의심' : 
                      '색각 이상 의심 - 안과 상담 권장';

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-14 h-14 text-success" />
        </div>
        
        <h2 className="text-title2 text-foreground mb-2">테스트 완료!</h2>
        
        <div className="bg-secondary rounded-2xl p-6 w-full max-w-sm mb-6">
          <p className="text-caption1 text-muted-foreground text-center mb-2">정답률</p>
          <p className="text-5xl font-black text-primary text-center">
            {score}/{PLATES.length}
          </p>
          <p className="text-body2 text-foreground text-center mt-3 font-medium">
            {diagnosis}
          </p>
        </div>

        <p className="text-caption1 text-muted-foreground text-center mb-6">
          * 이 결과는 참고용이며, 정확한 진단은 안과 전문의와 상담하세요.
        </p>

        <button
          onClick={() => onComplete(score, PLATES.length)}
          className="btn-toss-primary w-full"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const currentPlate = PLATES[stage];

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 진행 상태 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption1 text-muted-foreground">진행률</span>
          <span className="text-caption1 text-primary font-semibold">
            {stage + 1} / {PLATES.length}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((stage + 1) / PLATES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 색판 표시 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <ColorPlate 
          bgColor={currentPlate.bgColor}
          dotColor={currentPlate.dotColor}
          answer={currentPlate.answer}
        />
        <p className="text-body2 text-muted-foreground mt-6">
          {currentPlate.description}
        </p>
      </div>

      {/* 입력 영역 */}
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="보이는 숫자 입력"
            className="input-toss flex-1"
            maxLength={3}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleSkip}
          className="w-full py-4 rounded-2xl bg-secondary text-muted-foreground font-bold text-body2"
        >
          안 보여요 / 모르겠어요
        </button>
      </div>
    </div>
  );
}
