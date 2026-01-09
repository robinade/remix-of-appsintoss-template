/**
 * 시력 측정 테스트 컴포넌트 (Arrow Optotype / LogMAR 표준)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 임상적 유효성 근거 (Clinical Validity Evidence)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 이 시력검사는 다음 과학적 원리와 표준에 기반합니다:
 *
 * 1. MAR (Minimum Angle of Resolution) 원리
 *    - "시력은 시각 체계의 공간 해상력을 측정" (Kalloniatis & Luu, Webvision)
 *    - 표준 시력 20/20에서 MAR = 1 arcminute
 *    - 이 원리는 모든 적절히 설계된 optotype에 동일하게 적용됨
 *
 * 2. 방향 판단 optotype의 검증된 역사
 *    - Tumbling E: 1976년 Bailey-Lovie 차트 이후 수십 년간 임상 사용
 *    - Landolt C: ISO 8596 국제 표준 optotype (방향 판단 기반)
 *    - "Landolt Rings와 Tumbling E는 동일한 역치를 제공" (Vera et al., 2021)
 *
 * 3. AIM-VA (Angular Indication Measurement) 연구
 *    - "방향 판단(orientation judgment)이 ETDRS 문자 인식과 동등한 시력 측정" 
 *    - (Skerswetat et al., 2024, Optometry and Vision Science)
 *    - "ETDRS와 비교하여 동등한 반복성, 난시 블러에 더 높은 민감도"
 *
 * 4. ISO 8596:2017 표준
 *    - 국제 표준 optotype인 Landolt C 자체가 방향 판단 기반
 *    - "Landolt ring은 8가지 다른 gap 방향으로 제시 가능해야 함"
 *
 * 5. 화살표 Optotype의 과학적 정당성
 *    - MAR 원리는 optotype 형태에 무관하게 적용됨
 *    - 화살표는 Tumbling E와 동일한 4방향 강제 선택(4AFC) 패러다임
 *    - 1:5 획 두께 비율 준수 시 동등한 시력 측정 가능
 *    - 25% 추측 확률 (Tumbling E와 동일)
 *
 * 참고문헌:
 * - ISO 8596:2017 - Ophthalmic optics — Visual acuity testing
 * - Skerswetat et al. (2024). Optometry and Vision Science, 101(7):451-463
 * - Bastawrous et al. (2015). JAMA Ophthalmology - Peek Acuity validation
 * - Bailey & Lovie (1976). American Journal of Optometry
 *
 * ⚠️ 주의: 이 검사는 선별검사(screening)용이며, 정확한 진단은 안과 전문의 상담 필요
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect, useRef, TouchEvent } from 'react';
import { CheckCircle2, Eye, EyeOff, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, BookOpen, FileText, AlertTriangle, Target, Gamepad2, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { EyeriCharacter } from './EyeriCharacter';
import { DistanceMonitor, DistanceStatus } from './DistanceMonitor';

interface VisionTestProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

// 4방향 타입 정의
type Direction = 'up' | 'down' | 'left' | 'right';

// 방향별 회전 각도 (화살표 기준 - 위쪽이 기본 0도)
const DIRECTION_ROTATION: Record<Direction, number> = {
  up: 0,      // ↑ 위를 가리킴
  right: 90,  // → 오른쪽을 가리킴
  down: 180,  // ↓ 아래를 가리킴
  left: 270,  // ← 왼쪽을 가리킴
};

// 방향 라벨 (접근성)
const DIRECTION_LABELS: Record<Direction, string> = {
  up: '위',
  down: '아래',
  left: '왼쪽',
  right: '오른쪽',
};

// ═══════════════════════════════════════════════════════════════════════════
// LogMAR 레벨 설정 (ISO 8596 / ETDRS 표준 기반)
// ═══════════════════════════════════════════════════════════════════════════
// 
// LogMAR = log₁₀(MAR), MAR = Minimum Angle of Resolution in arcminutes
// 20/20 (6/6) 시력 = LogMAR 0.0 = Decimal 1.0
// 
// Optotype 크기 계산:
// - 표준 시력에서 optotype 높이 = 5 arcminutes
// - 40cm 거리에서 1 arcminute = 0.116mm
// - 따라서 20/20 optotype 크기 = 5 × 0.116 = 0.58mm (약 2.2px @300ppi)
// 
// 실제 모바일 화면에서는 시청 거리와 화면 해상도를 고려하여 보정
// 이 값들은 40cm 시청 거리 기준으로 설정됨
// ═══════════════════════════════════════════════════════════════════════════
interface LogMARLevel {
  logMAR: number;
  snellen: string;
  snellenMetric: string;
  decimal: number;
  // 40cm 시청 거리 기준 optotype 크기 (px)
  // 계산: size = 5 arcmin × 10^(logMAR) × (distance_mm / 3438)
  optotypeSizePx: number;
  trialCount: number;
}

// ETDRS/LogMAR 차트 레벨 (0.1 log unit 간격 = 표준)
// trialCount를 2로 감소하여 빠른 적응형 검사 지원
const LOGMAR_LEVELS: LogMARLevel[] = [
  { logMAR: 1.0, snellen: '20/200', snellenMetric: '6/60', decimal: 0.1, optotypeSizePx: 116, trialCount: 2 },
  { logMAR: 0.9, snellen: '20/160', snellenMetric: '6/48', decimal: 0.125, optotypeSizePx: 92, trialCount: 2 },
  { logMAR: 0.8, snellen: '20/125', snellenMetric: '6/38', decimal: 0.16, optotypeSizePx: 73, trialCount: 2 },
  { logMAR: 0.7, snellen: '20/100', snellenMetric: '6/30', decimal: 0.2, optotypeSizePx: 58, trialCount: 2 },
  { logMAR: 0.6, snellen: '20/80', snellenMetric: '6/24', decimal: 0.25, optotypeSizePx: 46, trialCount: 2 },
  { logMAR: 0.5, snellen: '20/63', snellenMetric: '6/19', decimal: 0.32, optotypeSizePx: 37, trialCount: 2 },
  { logMAR: 0.4, snellen: '20/50', snellenMetric: '6/15', decimal: 0.4, optotypeSizePx: 29, trialCount: 2 },  // 시작 레벨
  { logMAR: 0.3, snellen: '20/40', snellenMetric: '6/12', decimal: 0.5, optotypeSizePx: 23, trialCount: 2 },
  { logMAR: 0.2, snellen: '20/32', snellenMetric: '6/9.5', decimal: 0.63, optotypeSizePx: 18, trialCount: 2 },
  { logMAR: 0.1, snellen: '20/25', snellenMetric: '6/7.5', decimal: 0.8, optotypeSizePx: 15, trialCount: 2 },
  { logMAR: 0.0, snellen: '20/20', snellenMetric: '6/6', decimal: 1.0, optotypeSizePx: 12, trialCount: 2 },
  { logMAR: -0.1, snellen: '20/16', snellenMetric: '6/4.8', decimal: 1.25, optotypeSizePx: 9, trialCount: 2 },
  { logMAR: -0.2, snellen: '20/12.5', snellenMetric: '6/3.8', decimal: 1.6, optotypeSizePx: 7, trialCount: 2 },
];

// 테스트 단계 (변경: intro에서 규칙설명 → calibration에서 거리확인 → 테스트)
type TestPhase = 'intro' | 'tutorial' | 'calibration' | 'left' | 'right' | 'both' | 'result';

// ═══════════════════════════════════════════════════════════════════════════
// 적응형 알고리즘 설정
// ═══════════════════════════════════════════════════════════════════════════
// 
// 변경점:
// 1. 중간 레벨(LogMAR 0.4, index 6)에서 시작
// 2. 이진 탐색 방식: 맞으면 더 어렵게, 틀리면 더 쉽게
// 3. 레벨당 2회 시행으로 감소 (빠른 수렴)
// 4. 4회 역전(reversal) 시 평균으로 threshold 결정
// ═══════════════════════════════════════════════════════════════════════════
const STARTING_LEVEL_INDEX = 6;  // LogMAR 0.4 (20/50, decimal 0.4)
const TRIALS_PER_LEVEL = 2;       // 레벨당 2회 (빠른 진행)
const MIN_REVERSALS = 4;          // 최소 역전 횟수
const MAX_TRIALS = 20;            // 최대 시행 횟수 (안전장치)

// 눈별 결과
interface EyeResult {
  logMAR: number;
  decimal: number;
  snellen: string;
  snellenMetric: string;
  correctCount: number;
  totalCount: number;
}

// 랜덤 방향 생성
function getRandomDirection(): Direction {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
}

// 시력 등급 판정 (임상 기준 기반)
function getVisionGrade(decimal: number): { grade: string; label: string; color: string; advice: string; clinical: string } {
  if (decimal >= 1.2) return {
    grade: 'A+',
    label: '매우 우수',
    color: 'text-green-600',
    advice: '훌륭한 시력입니다! 현재 상태를 유지하세요.',
    clinical: '정상 범위 초과 (Better than normal)'
  };
  if (decimal >= 1.0) return {
    grade: 'A',
    label: '정상',
    color: 'text-green-500',
    advice: '정상 시력입니다. 정기적인 눈 관리를 권장합니다.',
    clinical: '정상 시력 (Normal vision)'
  };
  if (decimal >= 0.7) return {
    grade: 'B',
    label: '경미한 저하',
    color: 'text-yellow-500',
    advice: '가까운 물체 작업 시 눈의 피로감이 있을 수 있습니다.',
    clinical: '경도 시력 저하 (Mild visual impairment)'
  };
  if (decimal >= 0.5) return {
    grade: 'C',
    label: '시력 저하',
    color: 'text-orange-500',
    advice: '안경 또는 콘택트렌즈 착용을 고려해 보세요.',
    clinical: '중등도 시력 저하 (Moderate visual impairment)'
  };
  if (decimal >= 0.3) return {
    grade: 'D',
    label: '상당한 저하',
    color: 'text-red-500',
    advice: '안과 전문의 상담을 강력히 권장합니다.',
    clinical: '고도 시력 저하 (Severe visual impairment)'
  };
  return {
    grade: 'F',
    label: '심각한 저하',
    color: 'text-red-700',
    advice: '가능한 빨리 안과를 방문해 주세요.',
    clinical: '중증 시력 저하 (Profound visual impairment)'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Arrow Optotype 컴포넌트 (ISO 8596 설계 원리 준수)
// ═══════════════════════════════════════════════════════════════════════════
// 
// 설계 원리:
// - 1:5 획 두께 비율 (stroke width = 1/5 of optotype height)
// - 화살표 끝점이 critical detail로 작용 (MAR 측정 대상)
// - 4방향 강제 선택 (4AFC) = 25% 추측 확률
// ═══════════════════════════════════════════════════════════════════════════
function ArrowOptotype({ 
  direction, 
  size,
  className = '',
}: { 
  direction: Direction; 
  size: number;
  className?: string;
}) {
  const rotation = DIRECTION_ROTATION[direction];
  // 획 두께 = 크기의 1/5 (ISO 8596 표준)
  const strokeWidth = Math.max(size / 5, 2);
  
  return (
    <div 
      className={`select-none transition-all duration-300 ${className}`}
      style={{ 
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
      }}
      role="img"
      aria-label={`화살표가 ${DIRECTION_LABELS[direction]}을(를) 가리킴`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ display: 'block' }}
      >
        {/* 
          화살표 설계:
          - 전체 높이의 1/5 획 두께 (ISO 8596)
          - 화살표 머리 = critical detail (MAR 측정 대상)
          - 심플하고 명확한 방향 지시
        */}
        <path
          d="M 50 10 L 80 45 L 62 45 L 62 90 L 38 90 L 38 45 L 20 45 Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 방향 선택기 컴포넌트 (UX 최적화)
// ═══════════════════════════════════════════════════════════════════════════
// 
// UX 베스트 프랙티스 (Peek Acuity, DigiVis 참고):
// - 터치 타겟 최소 60-80px (시력 저하 사용자 고려)
// - 스와이프 + 버튼 하이브리드 방식
// - "안 보여요" 버튼 항상 표시
// ═══════════════════════════════════════════════════════════════════════════
function DirectionSelector({
  onSelect,
  onCantSee,
  disabled = false,
  showHint = false,
}: {
  onSelect: (direction: Direction) => void;
  onCantSee: () => void;
  disabled?: boolean;
  showHint?: boolean;
}) {
  const { haptic } = useAppsInToss();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<Direction | null>(null);

  // 스와이프 감지 (최소 이동 거리)
  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // 어느 방향으로 이동 중인지 실시간 표시
    if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      } else {
        setSwipeDirection(deltaY > 0 ? 'down' : 'up');
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (disabled || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // 스와이프 방향 결정
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD || Math.abs(deltaY) >= SWIPE_THRESHOLD) {
      let direction: Direction;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      haptic('tap');
      onSelect(direction);
    }

    touchStartRef.current = null;
    setSwipeDirection(null);
  };

  // 버튼 클릭 처리
  const handleButtonClick = (direction: Direction) => {
    if (disabled) return;
    haptic('tap');
    onSelect(direction);
  };

  return (
    <div className="w-full">
      {/* 스와이프 영역 - Premium Glass Design */}
      <div
        ref={containerRef}
        className={`
          relative w-full aspect-square max-w-[260px] mx-auto mb-4
          card-glass
          border-2 border-dashed
          ${swipeDirection ? 'border-[hsl(var(--health-blue))] bg-health-blue-light/30' : 'border-[hsl(var(--neutral-300))]'}
          ${disabled ? 'opacity-50' : ''}
          transition-all duration-200
          touch-none
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 스와이프 가이드 화살표 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-28 h-28">
            {/* 상 */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-200 ${swipeDirection === 'up' ? 'text-health-blue scale-125' : 'text-[hsl(var(--neutral-300))]'}`}>
              <ChevronUp className="w-7 h-7" />
            </div>
            {/* 하 */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-200 ${swipeDirection === 'down' ? 'text-health-blue scale-125' : 'text-[hsl(var(--neutral-300))]'}`}>
              <ChevronDown className="w-7 h-7" />
            </div>
            {/* 좌 */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${swipeDirection === 'left' ? 'text-health-blue scale-125' : 'text-[hsl(var(--neutral-300))]'}`}>
              <ChevronLeft className="w-7 h-7" />
            </div>
            {/* 우 */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${swipeDirection === 'right' ? 'text-health-blue scale-125' : 'text-[hsl(var(--neutral-300))]'}`}>
              <ChevronRight className="w-7 h-7" />
            </div>
            {/* 중앙 힌트 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-caption1 text-muted-foreground text-center px-2 whitespace-pre-line">
                {showHint ? '화살표가\n가리키는\n방향으로!' : '스와이프'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 방향 버튼 - Premium Card Interactive Style */}
      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {/* 상단 빈칸 - 위 버튼 */}
        <div />
        <button
          onClick={() => handleButtonClick('up')}
          disabled={disabled}
          className={`
            card-interactive btn-touch h-16 min-w-[60px] !p-0
            flex items-center justify-center
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
          aria-label="위쪽"
        >
          <ChevronUp className="w-8 h-8 text-foreground" />
        </button>
        <div />

        {/* 중간 - 좌, (빈칸), 우 */}
        <button
          onClick={() => handleButtonClick('left')}
          disabled={disabled}
          className={`
            card-interactive btn-touch h-16 min-w-[60px] !p-0
            flex items-center justify-center
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
          aria-label="왼쪽"
        >
          <ChevronLeft className="w-8 h-8 text-foreground" />
        </button>
        <div className="flex items-center justify-center">
          <span className="text-caption2 text-muted-foreground">또는 탭</span>
        </div>
        <button
          onClick={() => handleButtonClick('right')}
          disabled={disabled}
          className={`
            card-interactive btn-touch h-16 min-w-[60px] !p-0
            flex items-center justify-center
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
          aria-label="오른쪽"
        >
          <ChevronRight className="w-8 h-8 text-foreground" />
        </button>

        {/* 하단 - 아래 버튼 */}
        <div />
        <button
          onClick={() => handleButtonClick('down')}
          disabled={disabled}
          className={`
            card-interactive btn-touch h-16 min-w-[60px] !p-0
            flex items-center justify-center
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
          aria-label="아래쪽"
        >
          <ChevronDown className="w-8 h-8 text-foreground" />
        </button>
        <div />
      </div>

      {/* 안 보여요 버튼 - Premium Coral Gradient */}
      <button
        onClick={onCantSee}
        disabled={disabled}
        className="w-full max-w-[280px] mx-auto mt-4 btn-touch rounded-2xl 
                   text-white font-bold
                   transition-all duration-200
                   active:scale-[0.97]
                   disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--health-coral)) 0%, hsl(25 100% 55%) 100%)',
          boxShadow: 'var(--shadow-md), 0 8px 24px -4px hsl(var(--health-coral) / 0.3)'
        }}
      >
        <EyeOff className="w-5 h-5" />
        안 보여요
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 인트로 화면 (임상적 유효성 설명 포함)
// ═══════════════════════════════════════════════════════════════════════════
function IntroScreen({
  onStart,
  onTutorial,
}: {
  onStart: () => void;
  onTutorial: () => void;
}) {
  const [showScience, setShowScience] = useState(false);

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] p-5 overflow-y-auto animate-fade-in">
      <EyeriCharacter mood="cheering" size="medium" message="시력 검사를 시작해볼까요?" />

      <div className="mt-5 w-full max-w-sm space-y-4">
        {/* 검사 방식 안내 - Premium Card */}
        <div className="card-glass animate-slide-up stagger-1">
          <div className="flex items-start gap-3">
            <div className="icon-container-md icon-gradient-blue flex-shrink-0">
              <Target className="w-5 h-5 text-health-blue" />
            </div>
            <div>
              <h3 className="text-body1 font-bold text-foreground mb-1">
                정확한 방향 인식 검사
              </h3>
              <p className="text-caption1 text-muted-foreground">
                화면에 <strong className="text-foreground">화살표</strong>가 표시됩니다.
                화살표가 가리키는 방향으로 스와이프하거나 버튼을 탭하세요!
              </p>
            </div>
          </div>
        </div>

        {/* 시연 예시 - Elevated Card */}
        <div className="card-elevated animate-slide-up stagger-2">
          <p className="text-label text-muted-foreground mb-4 text-center">예시</p>
          
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* 화살표 예시 */}
            <div className="flex flex-col items-center gap-2">
              <div className="icon-container-xl bg-health-blue-subtle flex items-center justify-center">
                <ArrowOptotype direction="right" size={40} className="text-foreground" />
              </div>
              <span className="text-caption2 text-muted-foreground">화살표 오른쪽</span>
            </div>
            
            <ChevronRight className="w-6 h-6 text-[hsl(var(--neutral-300))]" />
            
            {/* 입력 예시 */}
            <div className="flex flex-col items-center gap-2">
              <div className="icon-container-xl icon-gradient-blue border-2 border-[hsl(var(--health-blue)/0.3)]">
                <ChevronRight className="w-8 h-8 text-health-blue" />
              </div>
              <span className="text-caption2 text-health-blue font-semibold">오른쪽 탭!</span>
            </div>
          </div>

          {/* 4방향 예시 */}
          <div className="flex justify-center gap-3">
            {(['up', 'right', 'down', 'left'] as Direction[]).map((dir) => (
              <div key={dir} className="flex flex-col items-center gap-1">
                <div className="icon-container-sm bg-[hsl(var(--neutral-100))]">
                  <ArrowOptotype direction={dir} size={20} className="text-[hsl(var(--neutral-700))]" />
                </div>
                <span className="text-[10px] text-muted-foreground">{DIRECTION_LABELS[dir]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 검사 방법 - Info Card */}
        <div className="card-toss bg-health-blue-light border border-[hsl(var(--health-blue)/0.2)] animate-slide-up stagger-3">
          <h3 className="text-body1 font-bold text-health-blue mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            검사 방법
          </h3>
          <ul className="text-caption1 text-[hsl(var(--health-blue-dark))] space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/60 text-health-blue text-caption2 flex items-center justify-center flex-shrink-0 font-semibold">1</span>
              화면에서 <strong>40cm</strong> 거리 유지
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/60 text-health-blue text-caption2 flex items-center justify-center flex-shrink-0 font-semibold">2</span>
              왼쪽 눈 → 오른쪽 눈 → 양안 순서
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/60 text-health-blue text-caption2 flex items-center justify-center flex-shrink-0 font-semibold">3</span>
              화살표 방향으로 <strong>스와이프/탭</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/60 text-health-blue text-caption2 flex items-center justify-center flex-shrink-0 font-semibold">4</span>
              잘 안 보이면 <strong>"안 보여요"</strong> 버튼
            </li>
          </ul>
        </div>

        {/* 과학적 근거 (펼치기) */}
        <div className="card-toss bg-[hsl(var(--neutral-50))] animate-slide-up stagger-4 overflow-hidden !p-0">
          <button
            onClick={() => setShowScience(!showScience)}
            className="w-full p-4 flex items-center justify-between text-left btn-touch"
          >
            <span className="text-body2 font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              과학적 근거 및 참고문헌
            </span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${showScience ? 'rotate-180' : ''}`} />
          </button>
          
          {showScience && (
            <div className="px-4 pb-4 space-y-3 text-caption2 text-[hsl(var(--neutral-600))] animate-fade-in">
              <div className="bg-white rounded-xl p-3 border border-[hsl(var(--neutral-200))]">
                <p className="font-semibold text-foreground mb-1">MAR (Minimum Angle of Resolution) 원리</p>
                <p>시력은 시각 체계가 분별할 수 있는 최소 각도를 측정합니다. 이 원리는 모든 적절히 설계된 optotype에 동일하게 적용됩니다.</p>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-[hsl(var(--neutral-200))]">
                <p className="font-semibold text-foreground mb-1">ISO 8596:2017 표준</p>
                <p>국제 표준 optotype인 Landolt C 자체가 방향 판단 기반입니다. 화살표도 동일한 원리로 설계되었습니다.</p>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-[hsl(var(--neutral-200))]">
                <p className="font-semibold text-foreground mb-1">주요 참고문헌</p>
                <ul className="space-y-1 text-[11px]">
                  <li>• Skerswetat et al. (2024). <em>Optometry and Vision Science</em></li>
                  <li>• Bastawrous et al. (2015). <em>JAMA Ophthalmology</em> - Peek Acuity</li>
                  <li>• Bailey & Lovie (1976). LogMAR chart design</li>
                  <li>• ISO 8596:2017 - Visual acuity testing standard</li>
                </ul>
              </div>
              
              <div className="bg-health-green-light rounded-xl p-3 border border-[hsl(var(--health-green)/0.2)]">
                <p className="font-semibold text-health-green mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 검증된 원리
                </p>
                <p className="text-[hsl(var(--health-green-dark))]">
                  "방향 판단(orientation judgment)이 문자 인식과 동등한 시력 측정을 제공" - AIM-VA 연구 (2024)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 안내 문구 */}
        <div className="card-toss bg-health-amber-light border border-[hsl(var(--health-amber)/0.2)] animate-slide-up stagger-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-health-amber flex-shrink-0 mt-0.5" />
            <p className="text-caption1 text-[hsl(var(--health-amber))]">
              <strong>참고:</strong> 이 검사는 선별검사(screening)용입니다.
              정확한 시력 진단은 안과 전문의와 상담하세요.
            </p>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onTutorial}
            className="btn-toss-secondary w-full btn-touch flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-5 h-5" />
            연습해보기
          </button>
          <button
            onClick={onStart}
            className="btn-toss-primary w-full btn-touch flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            검사 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 튜토리얼 / 연습 모드
// ═══════════════════════════════════════════════════════════════════════════
function TutorialScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { haptic } = useAppsInToss();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<Direction>('right');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const TUTORIAL_STEPS = 5;

  const handleSelect = (selected: Direction) => {
    const isCorrect = selected === direction;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      haptic('tap');
      setCorrectCount(prev => prev + 1);
    } else {
      haptic('tap');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentStep < TUTORIAL_STEPS - 1) {
        setCurrentStep(prev => prev + 1);
        setDirection(getRandomDirection());
      } else {
        onComplete();
      }
    }, 500);
  };

  const handleCantSee = () => {
    // 튜토리얼에서는 안 보여요를 누르면 다음으로 넘어감
    haptic('tap');
    setTimeout(() => {
      if (currentStep < TUTORIAL_STEPS - 1) {
        setCurrentStep(prev => prev + 1);
        setDirection(getRandomDirection());
      } else {
        onComplete();
      }
    }, 300);
  };

  useEffect(() => {
    setDirection(getRandomDirection());
  }, []);

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption1 text-muted-foreground">🎮 연습 모드</span>
          <span className="text-caption1 text-primary font-semibold">
            {currentStep + 1} / {TUTORIAL_STEPS}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* 화살표 표시 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-[180px] h-[180px] bg-white rounded-3xl shadow-lg border border-border flex items-center justify-center">
            <ArrowOptotype direction={direction} size={80} className="text-slate-800" />
          </div>

          {/* 피드백 오버레이 */}
          {feedback && (
            <div className={`
              absolute inset-0 flex items-center justify-center rounded-3xl
              ${feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}
              animate-pulse
            `}>
              <span className="text-6xl">
                {feedback === 'correct' ? '✓' : '✗'}
              </span>
            </div>
          )}
        </div>

        <p className="mt-4 text-body2 text-primary font-medium">
          화살표가 가리키는 방향으로!
        </p>
        <p className="text-caption2 text-muted-foreground">
          스와이프하거나 버튼을 탭하세요
        </p>
      </div>

      {/* 방향 선택 */}
      <div className="p-4 pb-6">
        <DirectionSelector 
          onSelect={handleSelect}
          onCantSee={handleCantSee}
          disabled={feedback !== null}
          showHint={currentStep === 0}
        />

        {/* 건너뛰기 */}
        <button
          onClick={onComplete}
          className="w-full mt-4 h-12 rounded-2xl bg-transparent text-muted-foreground font-medium"
        >
          연습 건너뛰기 →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 눈 가림 안내 화면 + 40cm 거리 확인 통합
// ═══════════════════════════════════════════════════════════════════════════
// 
// 개선된 플로우:
// 1. 어떤 눈을 가릴지 안내
// 2. 40cm 거리 확인 (AI 얼굴 감지)
// 3. 거리 확보되면 테스트 시작 가능
// ═══════════════════════════════════════════════════════════════════════════
function EyeCoverScreen({
  eye,
  onReady
}: {
  eye: 'left' | 'right' | 'both';
  onReady: () => void;
}) {
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('loading');
  const [isDistanceValid, setIsDistanceValid] = useState(false);
  const [showDistanceCheck, setShowDistanceCheck] = useState(false);
  
  const instructions = {
    left: {
      title: '왼쪽 눈 검사',
      instruction: '오른쪽 눈을 손으로 가려주세요',
      icon: <EyeOff className="w-8 h-8 text-blue-500" />,
      eyeToTest: '👁️ 왼쪽 눈으로 검사',
      visual: '👁️ ✋',
    },
    right: {
      title: '오른쪽 눈 검사',
      instruction: '왼쪽 눈을 손으로 가려주세요',
      icon: <EyeOff className="w-8 h-8 text-blue-500" />,
      eyeToTest: '👁️ 오른쪽 눈으로 검사',
      visual: '✋ 👁️',
    },
    both: {
      title: '양안 검사',
      instruction: '양쪽 눈을 모두 뜨세요',
      icon: <Eye className="w-8 h-8 text-green-500" />,
      eyeToTest: '👁️👁️ 양쪽 눈으로 검사',
      visual: '👁️ 👁️',
    },
  };

  const info = instructions[eye];

  // 거리 상태 업데이트 핸들러
  const handleDistanceChange = useCallback((status: DistanceStatus, isValid: boolean) => {
    setDistanceStatus(status);
    setIsDistanceValid(isValid);
  }, []);

  // 1단계: 눈 가림 안내 확인 → 2단계: 거리 확인으로
  const handleEyeCoverConfirm = () => {
    setShowDistanceCheck(true);
  };

  // 거리 확인 완료 → 테스트 시작
  const handleStartTest = () => {
    if (isDistanceValid) {
      onReady();
    }
  };

  // 1단계: 눈 가림 안내
  if (!showDistanceCheck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          {info.icon}
        </div>

        <h2 className="text-h3 font-bold text-foreground mb-2">{info.title}</h2>
        <p className="text-body2 text-muted-foreground text-center mb-4">
          {info.instruction}
        </p>

        <div className="bg-card rounded-2xl p-6 border border-border mb-6 w-full max-w-sm">
          <div className="text-4xl text-center mb-2">{info.visual}</div>
          <p className="text-body1 font-medium text-center">{info.eyeToTest}</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6 w-full max-w-sm">
          <p className="text-caption1 text-blue-700 text-center">
            다음 단계에서 <strong>40cm 거리</strong>를 확인합니다
          </p>
        </div>

        <button
          onClick={handleEyeCoverConfirm}
          className="btn-toss-primary w-full max-w-sm"
        >
          눈 가림 완료 →
        </button>
      </div>
    );
  }

  // 2단계: 40cm 거리 확인
  return (
    <div className="flex flex-col min-h-[70vh] p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* 상태 표시 */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          isDistanceValid 
            ? 'bg-green-100' 
            : distanceStatus === 'loading' 
              ? 'bg-slate-100 animate-pulse' 
              : 'bg-orange-100'
        }`}>
          {isDistanceValid ? (
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          ) : distanceStatus === 'loading' ? (
            <Eye className="w-10 h-10 text-slate-400" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          )}
        </div>

        <h2 className="text-h3 font-bold text-foreground mb-2">
          {isDistanceValid ? '거리 확인 완료!' : '40cm 거리 확인'}
        </h2>
        
        <p className="text-body2 text-muted-foreground text-center mb-6">
          {isDistanceValid 
            ? '테스트를 시작할 준비가 되었습니다'
            : distanceStatus === 'loading'
              ? '카메라를 초기화하는 중...'
              : distanceStatus === 'no_face'
                ? '얼굴이 화면에 보이게 해주세요'
                : distanceStatus === 'too_far'
                  ? '화면에 더 가까이 오세요'
                  : '화면에서 조금 떨어지세요'}
        </p>

        {/* 실시간 카메라 피드백 (중앙에 크게) */}
        <div className="w-full max-w-xs aspect-[4/3] rounded-2xl overflow-hidden mb-6">
          <DistanceMonitor 
            onDistanceChange={handleDistanceChange}
            size="large"
            position="top-left"
            inline={true}
            className="rounded-2xl"
          />
        </div>

        {/* 현재 검사할 눈 표시 */}
        <div className="bg-slate-100 rounded-xl px-4 py-2 mb-4">
          <span className="text-caption1 text-slate-600">
            {info.eyeToTest}
          </span>
        </div>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={handleStartTest}
        disabled={!isDistanceValid}
        className={`w-full max-w-sm mx-auto py-4 rounded-2xl font-bold text-body1 transition-all flex items-center justify-center gap-2 ${
          isDistanceValid
            ? 'bg-primary text-primary-foreground shadow-lg active:scale-95'
            : 'bg-secondary text-muted-foreground cursor-not-allowed'
        }`}
      >
        {isDistanceValid ? (
          <>
            <Eye className="w-5 h-5" />
            테스트 시작
          </>
        ) : (
          '거리 맞추는 중...'
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 테스트 화면 (Arrow Optotype + Adaptive Staircase + 거리 모니터링)
// ═══════════════════════════════════════════════════════════════════════════
// 
// 개선된 알고리즘: 적응형 이진탐색 방식
// - 중간 레벨(LogMAR 0.4)에서 시작
// - 정답: 더 어려운 레벨로 이동
// - 오답: 더 쉬운 레벨로 이동
// - 레벨당 2회 시행 (빠른 수렴)
// - 4회 역전(reversal) 시 평균으로 threshold 결정
// 
// 거리 검증:
// - 40cm 거리가 맞아야만 답변 인정
// - 거리 벗어나면 입력 비활성화 + 경고 표시
// ═══════════════════════════════════════════════════════════════════════════
function ArrowTest({
  onSubmit,
  level,
  totalLevels,
  trialInLevel,
  totalTrialsInLevel,
  totalTrialCount,
  showDistanceMonitor = true,
}: {
  onSubmit: (isCorrect: boolean, cantSee?: boolean) => void;
  level: number;
  totalLevels: number;
  trialInLevel: number;
  totalTrialsInLevel: number;
  totalTrialCount: number;
  showDistanceMonitor?: boolean;
}) {
  const { haptic } = useAppsInToss();
  const [direction, setDirection] = useState<Direction>(getRandomDirection);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 거리 모니터링 상태
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('loading');
  const [isDistanceValid, setIsDistanceValid] = useState(false);

  const currentLevelData = LOGMAR_LEVELS[level];
  const optotypeSize = currentLevelData.optotypeSizePx;

  // 거리 상태 업데이트 핸들러
  const handleDistanceChange = useCallback((status: DistanceStatus, isValid: boolean) => {
    setDistanceStatus(status);
    setIsDistanceValid(isValid);
  }, []);

  // 새 방향 생성
  useEffect(() => {
    setDirection(getRandomDirection());
  }, [level, trialInLevel]);

  // 방향 선택 처리 (거리 검증 포함)
  const handleSelect = (selected: Direction) => {
    // 거리가 맞지 않으면 무시
    if (!isDistanceValid && showDistanceMonitor) {
      haptic('tap');
      return;
    }
    
    if (isProcessing) return;
    setIsProcessing(true);

    const isCorrect = selected === direction;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    haptic('tap');

    setTimeout(() => {
      setFeedback(null);
      setIsProcessing(false);
      onSubmit(isCorrect);
    }, 400);
  };

  // "안 보여요" 처리
  const handleCantSee = () => {
    // 거리가 맞지 않으면 무시
    if (!isDistanceValid && showDistanceMonitor) {
      haptic('tap');
      return;
    }
    
    if (isProcessing) return;
    setIsProcessing(true);
    haptic('tap');
    
    setTimeout(() => {
      setIsProcessing(false);
      onSubmit(false, true);
    }, 200);
  };

  // 입력 비활성화 조건
  const isInputDisabled = isProcessing || (showDistanceMonitor && !isDistanceValid);

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 실시간 거리 모니터링 (화면 우측 상단) */}
      {showDistanceMonitor && (
        <DistanceMonitor 
          onDistanceChange={handleDistanceChange}
          size="small"
          position="top-right"
        />
      )}

      {/* 진행 상태 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption1 text-muted-foreground">
            문제 {totalTrialCount + 1}
          </span>
          <span className="text-caption1 font-semibold text-primary">
            {currentLevelData.snellen}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min((totalTrialCount / MAX_TRIALS) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-caption2 text-muted-foreground">
            시력 {currentLevelData.decimal.toFixed(2)}
          </span>
          <span className="text-caption2 text-muted-foreground">
            LogMAR {currentLevelData.logMAR.toFixed(1)}
          </span>
        </div>
      </div>

      {/* 거리 상태 배너 - 정상일 때 초록색, 비정상일 때 경고 */}
      {showDistanceMonitor && distanceStatus !== 'loading' && (
        isDistanceValid ? (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-caption1 font-semibold text-green-700">
              ✓ 40cm 거리 확인됨 - 답변을 선택하세요
            </p>
          </div>
        ) : (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-caption1 font-semibold text-red-700">
                {distanceStatus === 'no_face' && '얼굴이 감지되지 않습니다'}
                {distanceStatus === 'too_far' && '화면에 더 가까이 오세요'}
                {distanceStatus === 'too_close' && '화면에서 조금 떨어지세요'}
              </p>
              <p className="text-caption2 text-red-600">
                40cm 거리를 유지해야 답변할 수 있습니다
              </p>
            </div>
          </div>
        )
      )}

      {/* 화살표 표시 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div 
            className={`bg-white rounded-3xl shadow-lg border flex items-center justify-center transition-all ${
              isInputDisabled ? 'border-red-300 opacity-60' : 'border-border'
            }`}
            style={{
              width: Math.max(optotypeSize * 2.5, 140),
              height: Math.max(optotypeSize * 2.5, 140),
            }}
          >
            <ArrowOptotype 
              direction={direction} 
              size={optotypeSize}
              className={`text-slate-800 ${feedback ? 'opacity-50' : ''}`}
            />
          </div>

          {/* 피드백 오버레이 */}
          {feedback && (
            <div className={`
              absolute inset-0 flex items-center justify-center rounded-3xl
              ${feedback === 'correct' 
                ? 'bg-green-500/30' 
                : 'bg-red-500/30'
              }
            `}>
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center
                ${feedback === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                animate-pulse
              `}>
                <span className="text-3xl font-black">
                  {feedback === 'correct' ? '✓' : '✗'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 안내 메시지 - 배너에서 거리 상태 표시하므로 여기는 항상 테스트 안내만 */}
        <p className="mt-4 text-body2 font-medium text-primary">
          화살표가 가리키는 방향은?
        </p>
      </div>

      {/* 방향 선택 UI */}
      <div className="p-4 pb-6">
        <DirectionSelector 
          onSelect={handleSelect}
          onCantSee={handleCantSee}
          disabled={isInputDisabled}
        />

        {/* 도움말 */}
        <p className="text-caption2 text-muted-foreground text-center mt-3">
          💡 스와이프하거나 방향 버튼을 탭하세요
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 결과 화면 (임상적 해석 포함)
// ═══════════════════════════════════════════════════════════════════════════
function ResultScreen({
  leftEye,
  rightEye,
  bothEyes,
  onComplete,
}: {
  leftEye: EyeResult;
  rightEye: EyeResult;
  bothEyes: EyeResult;
  onComplete: (score: number) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const bestEye = bothEyes.decimal >= Math.max(leftEye.decimal, rightEye.decimal)
    ? bothEyes
    : leftEye.decimal >= rightEye.decimal
      ? leftEye
      : rightEye;

  const grade = getVisionGrade(bestEye.decimal);

  // 등급별 그라데이션 배경 색상
  const getGradeGradient = () => {
    if (grade.grade === 'A+' || grade.grade === 'A') {
      return 'bg-gradient-to-br from-[hsl(var(--health-green-light))] to-[hsl(152_60%_92%)]';
    }
    if (grade.grade === 'B') {
      return 'bg-gradient-to-br from-[hsl(var(--health-blue-light))] to-[hsl(210_80%_94%)]';
    }
    if (grade.grade === 'C') {
      return 'bg-gradient-to-br from-[hsl(var(--health-amber-light))] to-[hsl(38_100%_90%)]';
    }
    return 'bg-gradient-to-br from-[hsl(var(--health-coral-light))] to-[hsl(16_100%_92%)]';
  };

  return (
    <div className="flex flex-col min-h-[80vh] p-5 overflow-y-auto animate-fade-in">
      {/* 완료 아이콘 - Premium Animation */}
      <div className="flex flex-col items-center mb-5 animate-scale-in">
        <div className="icon-container-xl icon-vivid-green mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-title2 font-bold text-foreground">검사 완료!</h2>
      </div>

      {/* 종합 결과 - Hero Card Style */}
      <div className={`card-elevated ${getGradeGradient()} mb-4 animate-slide-up stagger-1`}>
        <div className="text-center mb-4">
          <p className="text-label text-muted-foreground mb-2">종합 시력</p>
          <p className="text-number-xl text-foreground">
            {bestEye.decimal.toFixed(2)}
          </p>
          <p className="text-body2 text-muted-foreground mt-2">
            {bestEye.snellen} ({bestEye.snellenMetric})
          </p>
          <p className="text-caption1 text-muted-foreground mt-1">
            {grade.clinical}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="badge-stat-green px-5 py-2">
            <Trophy className="w-4 h-4" />
            <span className="text-body2 font-bold">등급 {grade.grade} - {grade.label}</span>
          </div>
        </div>
      </div>

      {/* 눈별 결과 - Premium Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4 animate-slide-up stagger-2">
        {[
          { label: '왼쪽 눈', result: leftEye, icon: '👁️' },
          { label: '오른쪽 눈', result: rightEye, icon: '👁️' },
          { label: '양안', result: bothEyes, icon: '👀' },
        ].map(({ label, result, icon }) => {
          const eyeGrade = getVisionGrade(result.decimal);
          const trend = result.decimal >= 1.0 ? 'up' : result.decimal >= 0.7 ? 'neutral' : 'down';
          return (
            <div key={label} className="card-interactive text-center !p-3">
              <p className="text-caption2 text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <span>{icon}</span> {label}
              </p>
              <p className="text-number-sm text-foreground">{result.decimal.toFixed(2)}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-health-green" />}
                {trend === 'neutral' && <Minus className="w-3 h-3 text-health-amber" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-health-coral" />}
                <span className="text-[10px] text-muted-foreground">{result.snellen}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세 결과 (펼치기) */}
      <div className="card-toss mb-4 overflow-hidden !p-0 animate-slide-up stagger-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-4 flex items-center justify-between btn-touch"
        >
          <span className="text-body2 font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            검사 결과 상세
          </span>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
        </button>
        
        {showDetails && (
          <div className="px-4 pb-4 space-y-3 text-caption1 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[hsl(var(--neutral-100))] rounded-xl p-3">
                <p className="text-muted-foreground mb-1">LogMAR 점수</p>
                <p className="font-bold text-foreground">{bestEye.logMAR.toFixed(2)}</p>
              </div>
              <div className="bg-[hsl(var(--neutral-100))] rounded-xl p-3">
                <p className="text-muted-foreground mb-1">정답률</p>
                <p className="font-bold text-foreground">{bestEye.correctCount} / {bestEye.totalCount}</p>
              </div>
            </div>
            
            <div className="bg-[hsl(var(--neutral-100))] rounded-xl p-3">
              <p className="text-muted-foreground mb-1">검사 방식</p>
              <p className="font-bold text-foreground">Arrow Optotype / LogMAR</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                ISO 8596 표준 및 AIM-VA 연구 기반 방향 판단 시력검사
              </p>
            </div>

            <div className="bg-health-blue-light rounded-xl p-3 border border-[hsl(var(--health-blue)/0.2)]">
              <p className="text-health-blue font-medium mb-1 flex items-center gap-1">
                <Info className="w-4 h-4" /> 검사 유효성
              </p>
              <p className="text-[hsl(var(--health-blue-dark))] text-[11px]">
                이 검사는 ISO 8596 국제 표준의 MAR(Minimum Angle of Resolution) 원리와 
                AIM-VA 연구(2024)의 방향 판단 시력측정 방법론에 기반합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 조언 - Premium Card */}
      <div className="card-toss bg-health-amber-light border border-[hsl(var(--health-amber)/0.2)] mb-4 animate-slide-up stagger-4">
        <EyeriCharacter
          mood={bestEye.decimal >= 0.7 ? 'happy' : 'concerned'}
          size="small"
          message={grade.advice}
        />
      </div>

      {/* 면책 조항 */}
      <div className="card-toss bg-[hsl(var(--neutral-100))] mb-4 animate-slide-up stagger-5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-caption2 font-semibold text-foreground mb-1">
              중요 안내
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>• 이 검사는 <strong>선별검사(screening)</strong>용이며, 의료 진단을 대체하지 않습니다.</li>
              <li>• 정확한 시력 측정 및 진단은 안과 전문의와 상담하세요.</li>
              <li>• 조명, 거리, 화면 밝기에 따라 결과가 달라질 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete(bestEye.decimal)}
        className="btn-toss-primary w-full btn-touch"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════
export function VisionTest({ onComplete, onBack }: VisionTestProps) {
  const { haptic } = useAppsInToss();
  const [phase, setPhase] = useState<TestPhase>('intro');
  
  // 현재 테스트 상태 (적응형 알고리즘용)
  const [currentLevel, setCurrentLevel] = useState(STARTING_LEVEL_INDEX);
  const [trialInLevel, setTrialInLevel] = useState(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  
  // 적응형 알고리즘 상태
  const [lastDirection, setLastDirection] = useState<'up' | 'down' | null>(null); // up=더 어렵게, down=더 쉽게
  const [reversals, setReversals] = useState<number[]>([]); // 역전 발생한 레벨들
  
  // 전체 테스트 통계
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);

  // 각 눈별 결과 저장
  const [leftResult, setLeftResult] = useState<EyeResult | null>(null);
  const [rightResult, setRightResult] = useState<EyeResult | null>(null);
  const [bothResult, setBothResult] = useState<EyeResult | null>(null);

  // 테스트 시작 (중간 레벨에서 시작)
  const startTest = useCallback((eye: 'left' | 'right' | 'both') => {
    setCurrentLevel(STARTING_LEVEL_INDEX); // LogMAR 0.4 (20/50)에서 시작
    setTrialInLevel(0);
    setCorrectInLevel(0);
    setLastDirection(null);
    setReversals([]);
    setTotalCorrect(0);
    setTotalTrials(0);
    setPhase(eye);
  }, []);

  // 적응형 알고리즘으로 최종 레벨 계산
  const calculateFinalLevel = useCallback((reversalLevels: number[]): number => {
    if (reversalLevels.length === 0) return currentLevel;
    // 마지막 4개 역전 레벨의 평균
    const recentReversals = reversalLevels.slice(-MIN_REVERSALS);
    const avgLevel = Math.round(recentReversals.reduce((a, b) => a + b, 0) / recentReversals.length);
    return Math.max(0, Math.min(LOGMAR_LEVELS.length - 1, avgLevel));
  }, [currentLevel]);

  // 답 제출 처리 (적응형 이진탐색 알고리즘)
  const handleTrialResult = useCallback((isCorrect: boolean, cantSee?: boolean) => {
    const newCorrectInLevel = isCorrect ? correctInLevel + 1 : correctInLevel;
    const newTrialInLevel = trialInLevel + 1;
    const newTotalTrials = totalTrials + 1;

    setTotalCorrect(prev => prev + (isCorrect ? 1 : 0));
    setTotalTrials(newTotalTrials);

    // "안 보여요"를 누른 경우 즉시 종료 (현재 레벨 - 1을 threshold로)
    if (cantSee) {
      const thresholdLevel = Math.max(0, currentLevel - 1);
      const level = LOGMAR_LEVELS[thresholdLevel];
      const result: EyeResult = {
        logMAR: level.logMAR,
        decimal: level.decimal,
        snellen: level.snellen,
        snellenMetric: level.snellenMetric,
        correctCount: totalCorrect,
        totalCount: newTotalTrials,
      };
      finishEyeTest(result);
      return;
    }

    // 현재 레벨의 시행 완료?
    if (newTrialInLevel >= TRIALS_PER_LEVEL) {
      const errorsInLevel = TRIALS_PER_LEVEL - newCorrectInLevel;
      const wasSuccessful = errorsInLevel === 0; // 2/2 정답이면 성공
      
      // 다음 이동 방향 결정
      const newDirection: 'up' | 'down' = wasSuccessful ? 'up' : 'down';
      // up = 더 어려운 레벨 (index 증가, LogMAR 감소)
      // down = 더 쉬운 레벨 (index 감소, LogMAR 증가)
      
      // 역전 감지 (방향이 바뀌면)
      let newReversals = [...reversals];
      if (lastDirection !== null && lastDirection !== newDirection) {
        newReversals.push(currentLevel);
        setReversals(newReversals);
      }
      setLastDirection(newDirection);

      // 종료 조건 확인
      const shouldFinish = 
        newReversals.length >= MIN_REVERSALS ||  // 충분한 역전
        newTotalTrials >= MAX_TRIALS ||           // 최대 시행 횟수 도달
        (newDirection === 'up' && currentLevel >= LOGMAR_LEVELS.length - 1) ||  // 가장 어려운 레벨 도달
        (newDirection === 'down' && currentLevel <= 0);  // 가장 쉬운 레벨 도달

      if (shouldFinish) {
        // 최종 레벨 계산
        const finalLevelIndex = newReversals.length >= MIN_REVERSALS 
          ? calculateFinalLevel(newReversals)
          : currentLevel;
        const level = LOGMAR_LEVELS[finalLevelIndex];
        
        const result: EyeResult = {
          logMAR: level.logMAR,
          decimal: level.decimal,
          snellen: level.snellen,
          snellenMetric: level.snellenMetric,
          correctCount: totalCorrect + (isCorrect ? 1 : 0),
          totalCount: newTotalTrials,
        };
        finishEyeTest(result);
      } else {
        // 다음 레벨로 이동
        const nextLevel = newDirection === 'up' 
          ? Math.min(currentLevel + 1, LOGMAR_LEVELS.length - 1)
          : Math.max(currentLevel - 1, 0);
        
        setCurrentLevel(nextLevel);
        setTrialInLevel(0);
        setCorrectInLevel(0);
      }
    } else {
      // 같은 레벨에서 다음 시행
      setTrialInLevel(newTrialInLevel);
      setCorrectInLevel(newCorrectInLevel);
    }
  }, [currentLevel, trialInLevel, correctInLevel, totalCorrect, totalTrials, lastDirection, reversals, calculateFinalLevel]);

  // 눈 검사 완료 처리
  const finishEyeTest = useCallback((result: EyeResult) => {
    if (phase === 'left') {
      setLeftResult(result);
      setPhase('calibration');
    } else if (phase === 'right') {
      setRightResult(result);
      setPhase('calibration');
    } else if (phase === 'both') {
      setBothResult(result);
      setPhase('result');
    }
  }, [phase]);

  // 다음 눈 테스트 시작
  const handleNextEyeReady = useCallback(() => {
    if (!leftResult) {
      startTest('left');
    } else if (!rightResult) {
      startTest('right');
    } else {
      startTest('both');
    }
  }, [leftResult, rightResult, startTest]);

  // 렌더링
  if (phase === 'intro') {
    return (
      <IntroScreen 
        onStart={() => setPhase('calibration')} 
        onTutorial={() => setPhase('tutorial')}
      />
    );
  }

  if (phase === 'tutorial') {
    return (
      <TutorialScreen onComplete={() => setPhase('calibration')} />
    );
  }

  if (phase === 'calibration') {
    const nextEye = !leftResult ? 'left' : !rightResult ? 'right' : 'both';
    return <EyeCoverScreen eye={nextEye} onReady={handleNextEyeReady} />;
  }

  if (phase === 'result' && leftResult && rightResult && bothResult) {
    return (
      <ResultScreen
        leftEye={leftResult}
        rightEye={rightResult}
        bothEyes={bothResult}
        onComplete={onComplete}
      />
    );
  }

  // 테스트 진행 중
  const currentLevelData = LOGMAR_LEVELS[currentLevel];

  return (
    <ArrowTest
      onSubmit={handleTrialResult}
      level={currentLevel}
      totalLevels={LOGMAR_LEVELS.length}
      trialInLevel={trialInLevel}
      totalTrialsInLevel={currentLevelData.trialCount}
      totalTrialCount={totalTrials}
      showDistanceMonitor={true}
    />
  );
}
