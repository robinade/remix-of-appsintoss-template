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
import { CheckCircle2, Eye, EyeOff, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, BookOpen, FileText, AlertTriangle, Target, Gamepad2, Trophy, TrendingUp, TrendingDown, Minus, Clock, Glasses, User } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { EyeriCharacter } from './EyeriCharacter';
import { DistanceMonitor, DistanceStatus } from './DistanceMonitor';
import { PreTestQuestionnaire } from './PreTestQuestionnaire';
import { DuochromeTest } from './DuochromeTest';
import {
  UserProfile,
  DuochromeResult,
  getRepresentativeAge,
  needsReadingGlasses
} from '../types';
import {
  ZestState,
  ZestTrial,
  initializeZest,
  getNextStimulus,
  updateZestState,
  getThresholdEstimate,
  logMARToDecimal,
  logMARToSnellen,
  getClosestLevelIndex,
  detectGuessing,
  DEFAULT_ZEST_CONFIG,
} from '../utils/zestAlgorithm';

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
// 5회 시행으로 증가하여 추측 확률 대폭 감소 (6.25% → 1.56%)
// 더 높은 시력 레벨 추가 (2.0, 2.5)
const LOGMAR_LEVELS: LogMARLevel[] = [
  { logMAR: 1.0, snellen: '20/200', snellenMetric: '6/60', decimal: 0.1, optotypeSizePx: 116, trialCount: 5 },
  { logMAR: 0.9, snellen: '20/160', snellenMetric: '6/48', decimal: 0.125, optotypeSizePx: 92, trialCount: 5 },
  { logMAR: 0.8, snellen: '20/125', snellenMetric: '6/38', decimal: 0.16, optotypeSizePx: 73, trialCount: 5 },
  { logMAR: 0.7, snellen: '20/100', snellenMetric: '6/30', decimal: 0.2, optotypeSizePx: 58, trialCount: 5 },
  { logMAR: 0.6, snellen: '20/80', snellenMetric: '6/24', decimal: 0.25, optotypeSizePx: 46, trialCount: 5 },
  { logMAR: 0.5, snellen: '20/63', snellenMetric: '6/19', decimal: 0.32, optotypeSizePx: 37, trialCount: 5 },
  { logMAR: 0.4, snellen: '20/50', snellenMetric: '6/15', decimal: 0.4, optotypeSizePx: 29, trialCount: 5 },  // 시작 레벨
  { logMAR: 0.3, snellen: '20/40', snellenMetric: '6/12', decimal: 0.5, optotypeSizePx: 23, trialCount: 5 },
  { logMAR: 0.2, snellen: '20/32', snellenMetric: '6/9.5', decimal: 0.63, optotypeSizePx: 18, trialCount: 5 },
  { logMAR: 0.1, snellen: '20/25', snellenMetric: '6/7.5', decimal: 0.8, optotypeSizePx: 15, trialCount: 5 },
  { logMAR: 0.0, snellen: '20/20', snellenMetric: '6/6', decimal: 1.0, optotypeSizePx: 12, trialCount: 5 },
  { logMAR: -0.1, snellen: '20/16', snellenMetric: '6/4.8', decimal: 1.25, optotypeSizePx: 9, trialCount: 5 },
  { logMAR: -0.2, snellen: '20/12.5', snellenMetric: '6/3.8', decimal: 1.6, optotypeSizePx: 7, trialCount: 5 },
  { logMAR: -0.3, snellen: '20/10', snellenMetric: '6/3', decimal: 2.0, optotypeSizePx: 6, trialCount: 5 },  // 초정상 시력
  { logMAR: -0.4, snellen: '20/8', snellenMetric: '6/2.4', decimal: 2.5, optotypeSizePx: 5, trialCount: 5 },  // 매우 예리한 시력
];

// 테스트 단계 (ZEST 알고리즘 통합)
// questionnaire: 사전 질문 → duochrome: 적/녹 테스트(선택) → calibration → 테스트
type TestPhase = 'intro' | 'questionnaire' | 'duochrome' | 'tutorial' | 'calibration' | 'left' | 'right' | 'both' | 'result';

// ═══════════════════════════════════════════════════════════════════════════
// ZEST (Zippy Estimation by Sequential Testing) 알고리즘 설정
// ═══════════════════════════════════════════════════════════════════════════
//
// Bayesian 적응형 알고리즘:
// - 최대 15회 시행으로 ±0.15 logMAR 정밀도 달성 (기존 50회 대비 70% 감소)
// - 사전 확률 분포: 정규분포 (평균 0.0 logMAR, SD 0.8)
// - 처음 3회: 고정 브라켓팅 (0.4, 0.0, -0.2 logMAR)
// - 4회차부터: 사후 확률 평균에서 테스트
// - 조기 종료: 95% 신뢰구간 < 0.10 logMAR
//
// 참고: King-Smith et al. (1994), Turpin et al. (2003)
// ═══════════════════════════════════════════════════════════════════════════
const ZEST_MAX_TRIALS = 15;  // 최대 15회 (기존 50회에서 대폭 감소)

// 눈별 결과 (ZEST 알고리즘 + 응답 시간 분석 포함)
interface EyeResult {
  logMAR: number;
  decimal: number;
  snellen: string;
  snellenMetric: string;
  correctCount: number;
  totalCount: number;
  // ZEST 알고리즘 결과
  confidenceInterval: number;  // 95% 신뢰구간 폭 (logMAR)
  trials: ZestTrial[];         // 모든 시행 기록
  // 응답 시간 분석
  averageResponseTimeMs: number;
  isLikelyGuessing: boolean;
}

// 랜덤 방향 생성
function getRandomDirection(): Direction {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
}

// 시력 등급 판정 (임상 기준 기반, 고시력 레벨 추가)
function getVisionGrade(decimal: number): { grade: string; label: string; color: string; advice: string; clinical: string } {
  if (decimal >= 2.0) return {
    grade: 'S',
    label: '초정상 (Eagle Vision)',
    color: 'text-purple-600',
    advice: '매우 드문 수준의 탁월한 시력입니다! 눈 건강을 잘 유지하세요.',
    clinical: '초정상 시력 (Exceptional - Eagle Vision)'
  };
  if (decimal >= 1.6) return {
    grade: 'A++',
    label: '탁월',
    color: 'text-blue-600',
    advice: '일반인 평균을 훨씬 뛰어넘는 우수한 시력입니다!',
    clinical: '탁월한 시력 (Excellent - Above average)'
  };
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
    if (isDistanceValid || distanceStatus === 'error') {
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
              : distanceStatus === 'error'
                ? '카메라 초기화에 실패했습니다'
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
        disabled={!isDistanceValid && distanceStatus !== 'error'}
        className={`w-full max-w-sm mx-auto py-4 rounded-2xl font-bold text-body1 transition-all flex items-center justify-center gap-2 ${
          isDistanceValid
            ? 'bg-primary text-primary-foreground shadow-lg active:scale-95'
            : distanceStatus === 'error'
              ? 'bg-orange-500 text-white shadow-lg active:scale-95'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
        }`}
      >
        {isDistanceValid ? (
          <>
            <Eye className="w-5 h-5" />
            테스트 시작
          </>
        ) : distanceStatus === 'error' ? (
          <>
            <AlertTriangle className="w-5 h-5" />
            거리 확인 없이 시작
          </>
        ) : (
          '거리 맞추는 중...'
        )}
      </button>

      {/* 에러 시 도움말 */}
      {distanceStatus === 'error' && (
        <div className="w-full max-w-sm mx-auto mt-3">
          <p className="text-caption1 text-muted-foreground text-center">
            카메라를 사용할 수 없어도 테스트를 진행할 수 있습니다.
            <br />40cm 거리를 직접 유지해주세요.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 테스트 화면 (ZEST 알고리즘 + 응답 시간 분석 + 거리 모니터링)
// ═══════════════════════════════════════════════════════════════════════════
//
// ZEST (Zippy Estimation by Sequential Testing) Bayesian 적응형 알고리즘:
// - 사후 확률 분포 기반 최적 자극 선택
// - 처음 3회: 고정 브라켓팅 (0.4, 0.0, -0.2 logMAR)
// - 이후: 사후 확률 평균에서 테스트
// - 조기 종료: 95% 신뢰구간 < 0.10 logMAR
// - 최대 15회로 ±0.15 logMAR 정밀도 달성
//
// 응답 시간 분석:
// - 각 시행 응답 시간 기록
// - 500ms 미만 응답 = 추측 가능성
// - 평균 응답 시간 > 5초 = 조절 피로
// ═══════════════════════════════════════════════════════════════════════════
function ZestArrowTest({
  onComplete,
  showDistanceMonitor = true,
}: {
  onComplete: (result: EyeResult) => void;
  showDistanceMonitor?: boolean;
}) {
  const { haptic } = useAppsInToss();
  const [zestState, setZestState] = useState<ZestState>(() => initializeZest());
  const [direction, setDirection] = useState<Direction>(getRandomDirection);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 응답 시간 추적
  const stimulusShownTimeRef = useRef<number>(Date.now());

  // 거리 모니터링 상태
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('loading');
  const [isDistanceValid, setIsDistanceValid] = useState(false);

  // 현재 시행의 logMAR 레벨
  const currentLogMAR = getNextStimulus(zestState);
  const currentLevelIndex = getClosestLevelIndex(currentLogMAR, LOGMAR_LEVELS);
  const currentLevelData = LOGMAR_LEVELS[currentLevelIndex];
  const optotypeSize = currentLevelData.optotypeSizePx;

  // 거리 상태 업데이트 핸들러
  const handleDistanceChange = useCallback((status: DistanceStatus, isValid: boolean) => {
    setDistanceStatus(status);
    setIsDistanceValid(isValid);
  }, []);

  // 새 자극 표시 시 시간 기록 및 방향 변경
  useEffect(() => {
    setDirection(getRandomDirection());
    stimulusShownTimeRef.current = Date.now();
  }, [zestState.trialNumber]);

  // 방향 선택 처리 (ZEST 업데이트 포함)
  const handleSelect = (selected: Direction) => {
    // 거리가 맞지 않으면 무시
    if (!isDistanceValid && showDistanceMonitor) {
      haptic('tap');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const isCorrect = selected === direction;
    const responseTimeMs = Date.now() - stimulusShownTimeRef.current;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    haptic('tap');

    setTimeout(() => {
      setFeedback(null);
      setIsProcessing(false);

      // ZEST 상태 업데이트
      const newState = updateZestState(
        zestState,
        currentLogMAR,
        isCorrect,
        responseTimeMs
      );

      setZestState(newState);

      // 테스트 완료 확인
      if (newState.isComplete) {
        const threshold = getThresholdEstimate(newState);
        const guessAnalysis = detectGuessing(newState.trials);
        const levelIndex = getClosestLevelIndex(threshold, LOGMAR_LEVELS);
        const level = LOGMAR_LEVELS[levelIndex];

        const result: EyeResult = {
          logMAR: threshold,
          decimal: logMARToDecimal(threshold),
          snellen: logMARToSnellen(threshold),
          snellenMetric: level.snellenMetric,
          correctCount: newState.trials.filter(t => t.isCorrect).length,
          totalCount: newState.trials.length,
          confidenceInterval: newState.confidenceInterval,
          trials: newState.trials,
          averageResponseTimeMs: guessAnalysis.averageResponseTime,
          isLikelyGuessing: guessAnalysis.isLikelyGuessing,
        };

        onComplete(result);
      }
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

    const responseTimeMs = Date.now() - stimulusShownTimeRef.current;

    setTimeout(() => {
      setIsProcessing(false);

      // 오답으로 처리
      const newState = updateZestState(
        zestState,
        currentLogMAR,
        false,
        responseTimeMs
      );

      setZestState(newState);

      // 테스트 완료 확인
      if (newState.isComplete) {
        const threshold = getThresholdEstimate(newState);
        const guessAnalysis = detectGuessing(newState.trials);
        const levelIndex = getClosestLevelIndex(threshold, LOGMAR_LEVELS);
        const level = LOGMAR_LEVELS[levelIndex];

        const result: EyeResult = {
          logMAR: threshold,
          decimal: logMARToDecimal(threshold),
          snellen: logMARToSnellen(threshold),
          snellenMetric: level.snellenMetric,
          correctCount: newState.trials.filter(t => t.isCorrect).length,
          totalCount: newState.trials.length,
          confidenceInterval: newState.confidenceInterval,
          trials: newState.trials,
          averageResponseTimeMs: guessAnalysis.averageResponseTime,
          isLikelyGuessing: guessAnalysis.isLikelyGuessing,
        };

        onComplete(result);
      }
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

      {/* 진행 상태 (ZEST 기반) */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption1 text-muted-foreground">
            문제 {zestState.trialNumber + 1} / {ZEST_MAX_TRIALS}
          </span>
          <span className="text-caption1 font-semibold text-primary">
            {currentLevelData.snellen}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(((zestState.trialNumber + 1) / ZEST_MAX_TRIALS) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-caption2 text-muted-foreground">
            시력 {currentLevelData.decimal.toFixed(2)}
          </span>
          <span className="text-caption2 text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            빠른 측정 중
          </span>
        </div>
      </div>

      {/* 거리 상태 배너 */}
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

        {/* 안내 메시지 */}
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
// 결과 화면 (맥락 기반 해석 + ZEST 분석 + 응답 시간 분석)
// ═══════════════════════════════════════════════════════════════════════════
//
// 개선된 결과 해석:
// 1. "근거리 시력 (40cm)" 명시
// 2. 사용자 프로필 기반 맥락 해석
// 3. Duochrome 테스트 결과 반영
// 4. ZEST 알고리즘 신뢰도 표시
// 5. 응답 시간 분석 (추측 감지)
// ═══════════════════════════════════════════════════════════════════════════

// 나이 그룹 레이블
const AGE_GROUP_LABELS: Record<UserProfile['ageGroup'], string> = {
  '20s': '20대',
  '30s': '30대',
  '40s': '40대',
  '50s': '50대',
  '60plus': '60대 이상',
};

// 안경 타입 레이블
const GLASSES_TYPE_LABELS: Record<UserProfile['glassesType'], string> = {
  myopia: '근시용 안경/렌즈',
  hyperopia: '원시/노안용 안경/렌즈',
  multifocal: '다초점 렌즈',
  none: '미착용',
};

function ResultScreen({
  leftEye,
  rightEye,
  bothEyes,
  onComplete,
  userProfile,
  duochromeResult,
}: {
  leftEye: EyeResult;
  rightEye: EyeResult;
  bothEyes: EyeResult;
  onComplete: (score: number) => void;
  userProfile: UserProfile | null;
  duochromeResult: DuochromeResult | null;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const bestEye = bothEyes.decimal >= Math.max(leftEye.decimal, rightEye.decimal)
    ? bothEyes
    : leftEye.decimal >= rightEye.decimal
      ? leftEye
      : rightEye;

  const grade = getVisionGrade(bestEye.decimal);

  // 맥락 기반 해석 생성
  const getContextualInterpretation = (): string[] => {
    const interpretations: string[] = [];

    // 기본 해석: 40cm 근거리 시력
    interpretations.push('40cm 거리에서 측정한 근거리 시력입니다.');

    if (userProfile) {
      const age = getRepresentativeAge(userProfile.ageGroup);

      // 나이 기반 해석
      if (age >= 45 && !userProfile.wearingNow && userProfile.glassesType !== 'none') {
        if (needsReadingGlasses(age)) {
          interpretations.push('돋보기 미착용 상태로 측정되었습니다. 착용 시 결과가 달라질 수 있습니다.');
        }
      }

      // 안경 착용 상태 기반 해석
      if (userProfile.glassesType === 'myopia' && userProfile.wearingNow) {
        interpretations.push('근시 교정 안경 착용 상태에서 근거리 시력을 측정했습니다.');
        if (bestEye.decimal >= 1.2) {
          interpretations.push('근거리에서는 선명하게 보이지만, 원거리 시력은 별도 확인이 필요합니다.');
        }
      }

      // 근시용 안경 미착용 시 좋은 결과
      if (userProfile.glassesType === 'myopia' && !userProfile.wearingNow && bestEye.decimal >= 1.0) {
        interpretations.push('안경 미착용 상태에서도 40cm에서 잘 보입니다. 이는 근시의 특성상 정상적인 결과입니다.');
      }

      // 테스트 목적 기반 해석
      if (userProfile.testPurpose === 'uncorrected') {
        interpretations.push('맨눈 시력(안경/렌즈 없이)을 측정했습니다.');
      } else {
        interpretations.push('교정 시력(안경/렌즈 착용 상태)을 측정했습니다.');
      }
    }

    // Duochrome 결과 기반 해석
    if (duochromeResult) {
      if (duochromeResult.interpretation === 'myopic_tendency') {
        interpretations.push('색상 비교 테스트에서 근시 경향이 감지되었습니다. 원거리 시력 검사를 권장합니다.');
      } else if (duochromeResult.interpretation === 'hyperopic_tendency') {
        interpretations.push('색상 비교 테스트에서 원시 경향이 감지되었습니다. 근거리 작업 시 눈의 피로가 있을 수 있습니다.');
      } else {
        interpretations.push('색상 비교 테스트에서 균형 잡힌 상태가 확인되었습니다.');
      }
    }

    // 응답 시간 분석
    if (bestEye.isLikelyGuessing) {
      interpretations.push('⚠️ 응답 시간이 빨라 일부 추측이 포함되었을 수 있습니다. 재검사를 권장합니다.');
    } else if (bestEye.averageResponseTimeMs > 5000) {
      interpretations.push('응답 시간이 길어 조절 피로가 있을 수 있습니다.');
    }

    return interpretations;
  };

  // 등급별 그라데이션 배경 색상
  const getGradeGradient = () => {
    if (grade.grade === 'S' || grade.grade === 'A++' || grade.grade === 'A+' || grade.grade === 'A') {
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

  // ZEST 신뢰도 레벨
  const getConfidenceLevel = () => {
    if (bestEye.confidenceInterval <= 0.10) {
      return { label: '높음', color: 'text-health-green', bg: 'bg-health-green-light' };
    }
    if (bestEye.confidenceInterval <= 0.20) {
      return { label: '보통', color: 'text-health-amber', bg: 'bg-health-amber-light' };
    }
    return { label: '낮음', color: 'text-health-coral', bg: 'bg-health-coral-light' };
  };

  const confidenceLevel = getConfidenceLevel();
  const contextualInterpretations = getContextualInterpretation();

  return (
    <div className="flex flex-col min-h-[80vh] p-5 overflow-y-auto animate-fade-in">
      {/* 완료 아이콘 - Premium Animation */}
      <div className="flex flex-col items-center mb-5 animate-scale-in">
        <div className="icon-container-xl icon-vivid-green mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-title2 font-bold text-foreground">검사 완료!</h2>
        <p className="text-caption1 text-muted-foreground mt-1">근거리 시력 (40cm)</p>
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

        <div className="flex justify-center gap-2 flex-wrap">
          <div className="badge-stat-green px-4 py-2">
            <Trophy className="w-4 h-4" />
            <span className="text-body2 font-bold">등급 {grade.grade}</span>
          </div>
          <div className={`${confidenceLevel.bg} px-4 py-2 rounded-full flex items-center gap-1`}>
            <Target className="w-4 h-4" />
            <span className={`text-caption1 font-semibold ${confidenceLevel.color}`}>
              신뢰도 {confidenceLevel.label}
            </span>
          </div>
        </div>
      </div>

      {/* 사용자 프로필 요약 (있는 경우) */}
      {userProfile && (
        <div className="card-toss bg-[hsl(var(--neutral-50))] mb-4 animate-slide-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-caption1 font-semibold text-foreground">검사 조건</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white px-2 py-1 rounded-lg text-caption2 text-muted-foreground border border-[hsl(var(--neutral-200))]">
              {AGE_GROUP_LABELS[userProfile.ageGroup]}
            </span>
            <span className="bg-white px-2 py-1 rounded-lg text-caption2 text-muted-foreground border border-[hsl(var(--neutral-200))]">
              {userProfile.glassesType === 'none' ? '안경 미착용' : (
                userProfile.wearingNow
                  ? `${GLASSES_TYPE_LABELS[userProfile.glassesType]} 착용 중`
                  : `${GLASSES_TYPE_LABELS[userProfile.glassesType]} 미착용`
              )}
            </span>
            <span className="bg-white px-2 py-1 rounded-lg text-caption2 text-muted-foreground border border-[hsl(var(--neutral-200))]">
              {userProfile.testPurpose === 'uncorrected' ? '맨눈 시력' : '교정 시력'}
            </span>
          </div>
        </div>
      )}

      {/* 눈별 결과 - Premium Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4 animate-slide-up stagger-3">
        {[
          { label: '왼쪽 눈', result: leftEye, icon: '👁️' },
          { label: '오른쪽 눈', result: rightEye, icon: '👁️' },
          { label: '양안', result: bothEyes, icon: '👀' },
        ].map(({ label, result, icon }) => {
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

      {/* 맥락 기반 해석 */}
      <div className="card-toss bg-health-blue-light border border-[hsl(var(--health-blue)/0.2)] mb-4 animate-slide-up stagger-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-health-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body2 font-semibold text-health-blue mb-2">
              결과 해석
            </p>
            <ul className="text-caption1 text-[hsl(var(--health-blue-dark))] space-y-1">
              {contextualInterpretations.map((interpretation, i) => (
                <li key={i}>• {interpretation}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Duochrome 결과 (있는 경우) */}
      {duochromeResult && (
        <div className={`card-toss mb-4 animate-slide-up stagger-5 ${
          duochromeResult.interpretation === 'myopic_tendency'
            ? 'bg-red-50 border border-red-200'
            : duochromeResult.interpretation === 'hyperopic_tendency'
              ? 'bg-green-50 border border-green-200'
              : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              duochromeResult.interpretation === 'myopic_tendency'
                ? 'bg-red-100'
                : duochromeResult.interpretation === 'hyperopic_tendency'
                  ? 'bg-green-100'
                  : 'bg-blue-100'
            }`}>
              <Glasses className={`w-4 h-4 ${
                duochromeResult.interpretation === 'myopic_tendency'
                  ? 'text-red-600'
                  : duochromeResult.interpretation === 'hyperopic_tendency'
                    ? 'text-green-600'
                    : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className={`text-body2 font-semibold mb-1 ${
                duochromeResult.interpretation === 'myopic_tendency'
                  ? 'text-red-700'
                  : duochromeResult.interpretation === 'hyperopic_tendency'
                    ? 'text-green-700'
                    : 'text-blue-700'
              }`}>
                색상 비교 테스트 결과
              </p>
              <p className={`text-caption1 ${
                duochromeResult.interpretation === 'myopic_tendency'
                  ? 'text-red-600'
                  : duochromeResult.interpretation === 'hyperopic_tendency'
                    ? 'text-green-600'
                    : 'text-blue-600'
              }`}>
                {duochromeResult.interpretation === 'myopic_tendency'
                  ? '빨간색이 더 선명하게 보임 (근시 경향)'
                  : duochromeResult.interpretation === 'hyperopic_tendency'
                    ? '초록색이 더 선명하게 보임 (원시 경향)'
                    : '양쪽이 비슷하게 보임 (균형 상태)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 상세 결과 (펼치기) */}
      <div className="card-toss mb-4 overflow-hidden !p-0 animate-slide-up stagger-6">
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

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[hsl(var(--neutral-100))] rounded-xl p-3">
                <p className="text-muted-foreground mb-1">95% 신뢰구간</p>
                <p className="font-bold text-foreground">±{bestEye.confidenceInterval.toFixed(2)} logMAR</p>
              </div>
              <div className="bg-[hsl(var(--neutral-100))] rounded-xl p-3">
                <p className="text-muted-foreground mb-1">평균 응답 시간</p>
                <p className="font-bold text-foreground">{(bestEye.averageResponseTimeMs / 1000).toFixed(1)}초</p>
              </div>
            </div>

            <div className="bg-[hsl(var(--neutral-100))] rounded-xl p-3">
              <p className="text-muted-foreground mb-1">검사 방식</p>
              <p className="font-bold text-foreground">ZEST Bayesian 적응형 알고리즘</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                ISO 8596 표준 및 AIM-VA 연구 기반 Arrow Optotype 시력검사
              </p>
            </div>

            <div className="bg-health-blue-light rounded-xl p-3 border border-[hsl(var(--health-blue)/0.2)]">
              <p className="text-health-blue font-medium mb-1 flex items-center gap-1">
                <Info className="w-4 h-4" /> 검사 유효성
              </p>
              <p className="text-[hsl(var(--health-blue-dark))] text-[11px]">
                ZEST(Zippy Estimation by Sequential Testing) 알고리즘은 Bayesian 적응형 방식으로
                최소 시행 횟수로 정확한 시력 측정이 가능합니다.
                (참고: King-Smith et al. 1994, Turpin et al. 2003)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 조언 - Premium Card */}
      <div className="card-toss bg-health-amber-light border border-[hsl(var(--health-amber)/0.2)] mb-4 animate-slide-up stagger-7">
        <EyeriCharacter
          mood={bestEye.decimal >= 0.7 ? 'happy' : 'concerned'}
          size="small"
          message={grade.advice}
        />
      </div>

      {/* 면책 조항 */}
      <div className="card-toss bg-[hsl(var(--neutral-100))] mb-4 animate-slide-up stagger-8">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-caption2 font-semibold text-foreground mb-1">
              중요 안내
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>• 이 검사는 <strong>40cm 근거리 시력</strong>을 측정합니다. 원거리 시력과 다를 수 있습니다.</li>
              <li>• <strong>선별검사(screening)</strong>용이며, 의료 진단을 대체하지 않습니다.</li>
              <li>• 정확한 시력 측정 및 진단은 안과 전문의와 상담하세요.</li>
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
// 메인 컴포넌트 (ZEST 알고리즘 통합 + 사전 질문 + Duochrome 테스트)
// ═══════════════════════════════════════════════════════════════════════════
//
// 새로운 테스트 흐름:
// 1. intro: 검사 안내
// 2. questionnaire: 사전 질문 (나이, 안경, 목적)
// 3. duochrome: 적/녹 색상 비교 (선택, 굴절이상 감지)
// 4. tutorial: 연습 모드 (선택)
// 5. calibration: 눈 가림 + 40cm 거리 확인
// 6. left/right/both: ZEST 알고리즘 기반 시력 측정
// 7. result: 맥락 기반 결과 해석
// ═══════════════════════════════════════════════════════════════════════════
export function VisionTest({ onComplete, onBack }: VisionTestProps) {
  const { haptic } = useAppsInToss();
  const [phase, setPhase] = useState<TestPhase>('intro');

  // 사용자 프로필 (사전 질문 결과)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Duochrome 테스트 결과
  const [duochromeResult, setDuochromeResult] = useState<DuochromeResult | null>(null);

  // 각 눈별 결과 저장
  const [leftResult, setLeftResult] = useState<EyeResult | null>(null);
  const [rightResult, setRightResult] = useState<EyeResult | null>(null);
  const [bothResult, setBothResult] = useState<EyeResult | null>(null);

  // 사전 질문 완료 처리
  const handleQuestionnaireComplete = useCallback((profile: UserProfile) => {
    setUserProfile(profile);

    // 나이 기반 경고 확인
    const age = getRepresentativeAge(profile.ageGroup);

    // Duochrome 테스트는 선택적으로 제공
    // 40대 이상이거나 안경 착용자에게 권장
    if (age >= 40 || profile.glassesType !== 'none') {
      setPhase('duochrome');
    } else {
      setPhase('tutorial');
    }
  }, []);

  // 사전 질문 건너뛰기
  const handleQuestionnaireSkip = useCallback(() => {
    // 기본 프로필 설정
    setUserProfile({
      ageGroup: '30s',
      glassesType: 'none',
      wearingNow: false,
      testPurpose: 'uncorrected',
    });
    setPhase('tutorial');
  }, []);

  // Duochrome 테스트 완료 처리
  const handleDuochromeComplete = useCallback((result: DuochromeResult) => {
    setDuochromeResult(result);
    setPhase('tutorial');
  }, []);

  // Duochrome 테스트 건너뛰기
  const handleDuochromeSkip = useCallback(() => {
    setPhase('tutorial');
  }, []);

  // 테스트 시작 (ZEST 알고리즘 사용)
  const startTest = useCallback((eye: 'left' | 'right' | 'both') => {
    haptic('tap');
    setPhase(eye);
  }, [haptic]);

  // 눈 검사 완료 처리 (ZEST 결과 수신)
  const handleEyeTestComplete = useCallback((result: EyeResult) => {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 렌더링
  // ═══════════════════════════════════════════════════════════════════════════

  // 인트로 화면
  if (phase === 'intro') {
    return (
      <IntroScreen
        onStart={() => setPhase('questionnaire')}
        onTutorial={() => setPhase('questionnaire')}
      />
    );
  }

  // 사전 질문 화면
  if (phase === 'questionnaire') {
    return (
      <PreTestQuestionnaire
        onComplete={handleQuestionnaireComplete}
        onSkip={handleQuestionnaireSkip}
      />
    );
  }

  // Duochrome 테스트 화면
  if (phase === 'duochrome') {
    return (
      <DuochromeTest
        onComplete={handleDuochromeComplete}
        onSkip={handleDuochromeSkip}
      />
    );
  }

  // 튜토리얼 화면
  if (phase === 'tutorial') {
    return (
      <TutorialScreen onComplete={() => setPhase('calibration')} />
    );
  }

  // 캘리브레이션 (눈 가림 + 거리 확인)
  if (phase === 'calibration') {
    const nextEye = !leftResult ? 'left' : !rightResult ? 'right' : 'both';
    return <EyeCoverScreen eye={nextEye} onReady={handleNextEyeReady} />;
  }

  // 결과 화면
  if (phase === 'result' && leftResult && rightResult && bothResult) {
    return (
      <ResultScreen
        leftEye={leftResult}
        rightEye={rightResult}
        bothEyes={bothResult}
        onComplete={onComplete}
        userProfile={userProfile}
        duochromeResult={duochromeResult}
      />
    );
  }

  // 테스트 진행 중 (ZEST 알고리즘 사용)
  if (phase === 'left' || phase === 'right' || phase === 'both') {
    return (
      <ZestArrowTest
        onComplete={handleEyeTestComplete}
        showDistanceMonitor={true}
      />
    );
  }

  // Fallback
  return null;
}
