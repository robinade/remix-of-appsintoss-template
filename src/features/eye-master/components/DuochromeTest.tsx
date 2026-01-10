/**
 * Duochrome (적/녹) 테스트 컴포넌트
 *
 * 색수차(Chromatic Aberration)를 이용하여 40cm 거리에서
 * 굴절이상(근시/원시 경향)을 감지합니다.
 *
 * 원리:
 * - 초록빛(535nm): 망막 0.2D 앞에 초점
 * - 빨간빛(620nm): 망막 0.24D 뒤에 초점
 * - 근시: 빨간색이 더 선명하게 보임
 * - 원시: 초록색이 더 선명하게 보임
 */

import { useState } from 'react';
import { AlertTriangle, ChevronRight, Eye, Info } from 'lucide-react';
import { DuochromeResult } from '../types';
import { EyeriCharacter } from './EyeriCharacter';
import { useAppsInToss } from '@/hooks/useAppsInToss';

interface DuochromeTestProps {
  onComplete: (result: DuochromeResult) => void;
  onSkip?: () => void;
}

type Phase = 'intro' | 'test' | 'result';

// 화살표 Optotype (간단한 버전)
function ArrowOptotype({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      <path
        d="M 50 10 L 80 45 L 62 45 L 62 90 L 38 90 L 38 45 L 20 45 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function DuochromeTest({ onComplete, onSkip }: DuochromeTestProps) {
  const { haptic } = useAppsInToss();
  const [phase, setPhase] = useState<Phase>('intro');
  const [result, setResult] = useState<DuochromeResult | null>(null);

  const handleSelection = (response: 'red' | 'green' | 'equal') => {
    haptic('tap');

    // 결과 해석
    const interpretation: DuochromeResult['interpretation'] =
      response === 'red'
        ? 'myopic_tendency'
        : response === 'green'
        ? 'hyperopic_tendency'
        : 'balanced';

    const duochromeResult: DuochromeResult = {
      response,
      interpretation,
    };

    setResult(duochromeResult);
    setPhase('result');
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result);
    }
  };

  // 인트로 화면
  if (phase === 'intro') {
    return (
      <div className="flex flex-col min-h-[80vh] p-5 animate-fade-in">
        <EyeriCharacter
          mood="thinking"
          size="small"
          message="색상 비교 테스트를 해볼까요?"
        />

        <div className="mt-4 mb-6">
          <h2 className="text-h3 font-bold text-foreground mb-2">
            적/녹 색상 비교 테스트
          </h2>
          <p className="text-caption1 text-muted-foreground">
            눈의 굴절 상태를 간접적으로 확인할 수 있습니다
          </p>
        </div>

        {/* 설명 카드 */}
        <div className="card-glass mb-4 animate-slide-up stagger-1">
          <div className="flex items-start gap-3">
            <div className="icon-container-md icon-gradient-blue flex-shrink-0">
              <Eye className="w-5 h-5 text-health-blue" />
            </div>
            <div>
              <h3 className="text-body1 font-bold text-foreground mb-1">
                테스트 방법
              </h3>
              <p className="text-caption1 text-muted-foreground">
                화면에 빨간색 배경과 초록색 배경에 동일한 모양이 표시됩니다.
                어느 쪽이 더 선명하게 보이는지 선택하세요.
              </p>
            </div>
          </div>
        </div>

        {/* 예시 미리보기 */}
        <div className="card-elevated mb-4 animate-slide-up stagger-2">
          <p className="text-label text-muted-foreground mb-3 text-center">예시</p>
          <div className="flex gap-2">
            <div className="flex-1 h-24 rounded-xl bg-red-600 flex items-center justify-center">
              <ArrowOptotype size={32} />
            </div>
            <div className="flex-1 h-24 rounded-xl bg-green-600 flex items-center justify-center">
              <ArrowOptotype size={32} />
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="card-toss bg-health-amber-light border border-[hsl(var(--health-amber)/0.2)] mb-6 animate-slide-up stagger-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-health-amber flex-shrink-0 mt-0.5" />
            <p className="text-caption1 text-[hsl(var(--health-amber-dark))]">
              이 테스트는 <strong>참고용</strong>이며, 정확한 굴절 검사는 안과에서 받으세요.
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={() => setPhase('test')}
            className="btn-toss-primary w-full btn-touch"
          >
            테스트 시작
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-muted-foreground text-caption1 w-full"
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    );
  }

  // 테스트 화면
  if (phase === 'test') {
    return (
      <div className="flex flex-col min-h-[80vh] animate-fade-in">
        {/* 질문 */}
        <div className="p-5 pb-2">
          <h2 className="text-h3 font-bold text-foreground text-center">
            어느 쪽이 더 선명하게 보이나요?
          </h2>
          <p className="text-caption1 text-muted-foreground text-center mt-1">
            천천히 비교해보세요
          </p>
        </div>

        {/* 적/녹 분할 화면 */}
        <div className="flex-1 flex gap-1 px-4 py-2">
          {/* 빨간색 영역 */}
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center"
            style={{ backgroundColor: '#C62828' }}
          >
            <div className="text-black">
              <ArrowOptotype size={60} />
            </div>
            <p className="text-white/80 text-caption2 mt-3 font-medium">빨강</p>
          </div>

          {/* 초록색 영역 */}
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center"
            style={{ backgroundColor: '#2E7D32' }}
          >
            <div className="text-black">
              <ArrowOptotype size={60} />
            </div>
            <p className="text-white/80 text-caption2 mt-3 font-medium">초록</p>
          </div>
        </div>

        {/* 선택 버튼 */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelection('red')}
              className="btn-touch rounded-2xl py-4 text-white font-bold transition-all active:scale-95"
              style={{
                backgroundColor: '#C62828',
                boxShadow: '0 4px 12px rgba(198, 40, 40, 0.3)',
              }}
            >
              왼쪽<br />
              <span className="text-caption2 font-normal opacity-80">(빨강)</span>
            </button>

            <button
              onClick={() => handleSelection('equal')}
              className="btn-touch rounded-2xl py-4 bg-slate-600 text-white font-bold transition-all active:scale-95"
              style={{
                boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
              }}
            >
              같음
            </button>

            <button
              onClick={() => handleSelection('green')}
              className="btn-touch rounded-2xl py-4 text-white font-bold transition-all active:scale-95"
              style={{
                backgroundColor: '#2E7D32',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
              }}
            >
              오른쪽<br />
              <span className="text-caption2 font-normal opacity-80">(초록)</span>
            </button>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="text-muted-foreground text-caption1 w-full"
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    );
  }

  // 결과 화면
  if (phase === 'result' && result) {
    const interpretationText = {
      myopic_tendency: {
        title: '근시 경향',
        description: '빨간색이 더 선명하게 보였습니다.',
        advice: '원거리 시력이 흐릿할 수 있습니다. 정확한 검사는 안과에서 받으세요.',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      },
      hyperopic_tendency: {
        title: '원시 경향',
        description: '초록색이 더 선명하게 보였습니다.',
        advice: '근거리 작업 시 피로감이 있을 수 있습니다. 정확한 검사는 안과에서 받으세요.',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      },
      balanced: {
        title: '균형 잡힌 상태',
        description: '양쪽이 비슷하게 보였습니다.',
        advice: '현재 굴절 상태가 균형 잡혀 있거나, 적절히 교정된 상태입니다.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      },
    };

    const info = interpretationText[result.interpretation];

    return (
      <div className="flex flex-col min-h-[80vh] p-5 animate-fade-in">
        <EyeriCharacter
          mood={result.interpretation === 'balanced' ? 'happy' : 'thinking'}
          size="small"
          message="테스트가 완료되었어요!"
        />

        <div className="mt-4 mb-6">
          <h2 className="text-h3 font-bold text-foreground mb-2">
            색상 비교 결과
          </h2>
        </div>

        {/* 결과 카드 */}
        <div className={`card-elevated ${info.bgColor} border ${info.borderColor} mb-4 animate-slide-up`}>
          <h3 className={`text-title3 font-bold ${info.color} mb-2`}>
            {info.title}
          </h3>
          <p className="text-body2 text-foreground mb-3">
            {info.description}
          </p>
          <p className="text-caption1 text-muted-foreground">
            {info.advice}
          </p>
        </div>

        {/* 과학적 설명 */}
        <div className="card-toss bg-[hsl(var(--neutral-50))] mb-4 animate-slide-up stagger-1">
          <h4 className="text-body2 font-semibold text-foreground mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Duochrome 테스트란?
          </h4>
          <p className="text-caption2 text-muted-foreground">
            빨간빛과 초록빛은 눈에서 다른 위치에 초점을 맺습니다. 이 차이를 이용하여
            눈의 굴절 상태를 간접적으로 확인할 수 있습니다.
          </p>
        </div>

        {/* 면책 조항 */}
        <div className="card-toss bg-health-amber-light border border-[hsl(var(--health-amber)/0.2)] mb-6 animate-slide-up stagger-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-health-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-caption1 text-[hsl(var(--health-amber-dark))]">
                이 테스트는 <strong>참고용</strong>입니다. 정확한 굴절이상 진단 및
                시력 교정은 반드시 안과 전문의와 상담하세요.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleComplete}
            className="btn-toss-primary w-full btn-touch flex items-center justify-center gap-2"
          >
            시력 검사 계속하기
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
