/**
 * 시력 측정 테스트 컴포넌트
 */

import { useState, useMemo } from 'react';
import { CheckCircle2, Eye, ArrowRight } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';

interface VisionTestProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

const LETTERS = ['E', 'H', 'N', 'Z', 'P', 'V', 'D', 'U', 'F', 'C', 'O', 'L', 'T'];
const SIZES = [
  { size: 'text-8xl', vision: 0.1 },
  { size: 'text-7xl', vision: 0.2 },
  { size: 'text-6xl', vision: 0.3 },
  { size: 'text-5xl', vision: 0.4 },
  { size: 'text-4xl', vision: 0.5 },
  { size: 'text-3xl', vision: 0.6 },
  { size: 'text-2xl', vision: 0.8 },
  { size: 'text-xl', vision: 1.0 },
  { size: 'text-lg', vision: 1.2 },
  { size: 'text-base', vision: 1.5 },
];

export function VisionTest({ onComplete, onBack }: VisionTestProps) {
  const { haptic } = useAppsInToss();
  const [stage, setStage] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentLetter = useMemo(() => {
    return LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }, [stage]);

  const handleAnswer = async (canSee: boolean) => {
    await haptic('tap');
    
    if (canSee) {
      setCorrectAnswers(prev => prev + 1);
      
      if (stage < SIZES.length - 1) {
        setStage(prev => prev + 1);
      } else {
        setIsComplete(true);
      }
    } else {
      setIsComplete(true);
    }
  };

  const finalVision = isComplete 
    ? (correctAnswers > 0 ? SIZES[Math.min(correctAnswers - 1, SIZES.length - 1)].vision : 0.1)
    : 0;

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-14 h-14 text-success" />
        </div>
        
        <h2 className="text-title2 text-foreground mb-2">테스트 완료!</h2>
        
        <div className="bg-secondary rounded-2xl p-6 w-full max-w-sm mb-6">
          <p className="text-caption1 text-muted-foreground text-center mb-2">예상 시력 지수</p>
          <p className="text-5xl font-black text-primary text-center">
            {finalVision.toFixed(1)}
          </p>
          <p className="text-caption1 text-muted-foreground text-center mt-2">
            {finalVision >= 1.0 ? '정상 시력입니다' : 
             finalVision >= 0.7 ? '경미한 시력 저하' :
             finalVision >= 0.4 ? '안경 착용 권장' : '안과 방문 권장'}
          </p>
        </div>

        <p className="text-caption1 text-muted-foreground text-center mb-6">
          * 이 결과는 참고용이며, 정확한 진단은 안과 전문의와 상담하세요.
        </p>

        <button
          onClick={() => onComplete(finalVision)}
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
            {stage + 1} / {SIZES.length}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((stage + 1) / SIZES.length) * 100}%` }}
          />
        </div>
        
        <div className="mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-success/10">
          <Eye className="w-4 h-4 text-success" />
          <span className="text-caption1 text-success font-medium">
            거리 확보됨 (40cm 유지)
          </span>
        </div>
      </div>

      {/* 글자 표시 영역 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xs aspect-square bg-white rounded-3xl shadow-lg flex items-center justify-center border border-border">
          <span className={`${SIZES[stage].size} font-black text-foreground select-none`}>
            {currentLetter}
          </span>
        </div>
      </div>

      {/* 예상 시력 표시 */}
      <div className="px-6 pb-4">
        <p className="text-center text-caption1 text-muted-foreground">
          현재 테스트 시력: <span className="text-primary font-semibold">{SIZES[stage].vision}</span>
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="p-4 space-y-3">
        <button
          onClick={() => handleAnswer(true)}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-body1 flex items-center justify-center gap-2"
        >
          잘 보여요 <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="w-full py-4 rounded-2xl bg-secondary text-muted-foreground font-bold text-body1"
        >
          안 보여요 / 흐릿해요
        </button>
      </div>
    </div>
  );
}
