/**
 * 난시 테스트 컴포넌트
 */

import { useState } from 'react';
import { CheckCircle2, Target, Info } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';

interface AstigmatismTestProps {
  onComplete: (hasAstigmatism: boolean) => void;
  onBack: () => void;
}

export function AstigmatismTest({ onComplete, onBack }: AstigmatismTestProps) {
  const { haptic } = useAppsInToss();
  const [stage, setStage] = useState<'intro' | 'test' | 'result'>('intro');
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  const handleLineSelect = async (angle: number) => {
    await haptic('tap');
    
    if (selectedLines.includes(angle)) {
      setSelectedLines(prev => prev.filter(a => a !== angle));
    } else {
      setSelectedLines(prev => [...prev, angle]);
    }
  };

  const handleComplete = async () => {
    await haptic('success');
    setStage('result');
  };

  const hasAstigmatism = selectedLines.length > 0;

  if (stage === 'intro') {
    return (
      <div className="flex flex-col min-h-[80vh] p-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Target className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-title2 text-foreground mb-4 text-center">난시 테스트</h2>
          
          <div className="bg-secondary rounded-2xl p-5 w-full max-w-sm mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body2 text-foreground font-medium mb-2">테스트 방법</p>
                <ol className="text-caption1 text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>한쪽 눈을 가리고 방사형 선을 바라봅니다</li>
                  <li>모든 선이 동일한 굵기와 진하기로 보이는지 확인합니다</li>
                  <li>더 진하거나 굵게 보이는 선이 있다면 선택합니다</li>
                </ol>
              </div>
            </div>
          </div>

          <p className="text-caption1 text-muted-foreground text-center mb-6">
            화면에서 약 40cm 떨어져서 테스트하세요
          </p>
        </div>

        <button
          onClick={() => setStage('test')}
          className="btn-toss-primary w-full"
        >
          테스트 시작
        </button>
      </div>
    );
  }

  if (stage === 'result') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
          hasAstigmatism ? 'bg-warning/10' : 'bg-success/10'
        }`}>
          <CheckCircle2 className={`w-14 h-14 ${
            hasAstigmatism ? 'text-warning' : 'text-success'
          }`} />
        </div>
        
        <h2 className="text-title2 text-foreground mb-2">테스트 완료!</h2>
        
        <div className="bg-secondary rounded-2xl p-6 w-full max-w-sm mb-6">
          <p className="text-body1 text-foreground text-center font-semibold">
            {hasAstigmatism ? (
              <>
                난시 의심<br />
                <span className="text-caption1 font-normal text-muted-foreground">
                  선택한 방향: {selectedLines.map(a => `${a}°`).join(', ')}
                </span>
              </>
            ) : (
              '난시 의심 없음'
            )}
          </p>
        </div>

        {hasAstigmatism && (
          <p className="text-caption1 text-muted-foreground text-center mb-6">
            특정 방향의 선이 더 진하게 보인다면 난시가 있을 수 있습니다.
            정확한 진단은 안과 전문의와 상담하세요.
          </p>
        )}

        <button
          onClick={() => onComplete(hasAstigmatism)}
          className="btn-toss-primary w-full"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 테스트 화면
  const lines = [0, 30, 60, 90, 120, 150];

  return (
    <div className="flex flex-col min-h-[80vh]">
      <div className="p-4">
        <p className="text-body2 text-foreground text-center font-medium">
          더 진하게 보이는 선을 모두 선택하세요
        </p>
        <p className="text-caption1 text-muted-foreground text-center mt-1">
          모두 동일하게 보인다면 바로 완료를 누르세요
        </p>
      </div>

      {/* 방사형 선 차트 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-72 h-72">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* 외곽 원 */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="white" 
              stroke="hsl(var(--border))" 
              strokeWidth="1"
            />
            
            {/* 방사형 선 */}
            {lines.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 40 * Math.cos(rad);
              const y1 = 50 + 40 * Math.sin(rad);
              const x2 = 50 - 40 * Math.cos(rad);
              const y2 = 50 - 40 * Math.sin(rad);
              const isSelected = selectedLines.includes(angle);
              
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
                  strokeWidth={isSelected ? '3' : '2'}
                  className="cursor-pointer"
                  onClick={() => handleLineSelect(angle)}
                />
              );
            })}

            {/* 중앙점 */}
            <circle cx="50" cy="50" r="3" fill="hsl(var(--foreground))" />
          </svg>

          {/* 각도 선택 버튼 (오버레이) */}
          {lines.map((angle) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x = 50 + 55 * Math.cos(rad);
            const y = 50 + 55 * Math.sin(rad);
            const isSelected = selectedLines.includes(angle);
            
            return (
              <button
                key={angle}
                onClick={() => handleLineSelect(angle)}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-caption2 font-medium transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {angle}°
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={handleComplete}
          className="btn-toss-primary w-full"
        >
          테스트 완료
        </button>
      </div>
    </div>
  );
}
