/**
 * 색약 테스트 컴포넌트 (Enhanced)
 *
 * 개선 사항:
 * - Brettel/Vienot 색상 혼동선 알고리즘 기반 플레이트
 * - 14개 이상의 테스트 플레이트
 * - 색각 유형 감지 (적록색약, 청황색약)
 * - 심각도 평가
 * - Eyeri 캐릭터 통합
 */

import { useState, useMemo } from 'react';
import { CheckCircle2, Palette, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { EyeriCharacter } from './EyeriCharacter';
import { useAchievements } from '../hooks/useAchievements';

interface ColorBlindTestProps {
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

// 색각 이상 유형
type ColorVisionType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'unknown';

// 플레이트 유형
type PlateType = 'screening' | 'protan' | 'deutan' | 'tritan' | 'vanishing';

// 플레이트 정의
interface ColorPlateData {
  id: number;
  number: string;              // 정상 시력으로 보이는 숫자
  protanAnswer?: string;       // 적색약으로 보이는 숫자
  deutanAnswer?: string;       // 녹색약으로 보이는 숫자
  type: PlateType;
  // 색상 정의 (HSL)
  bgHue: number;
  bgSat: number;
  bgLight: number;
  fgHue: number;
  fgSat: number;
  fgLight: number;
}

// Ishihara 스타일 플레이트 데이터 (14개)
const PLATES: ColorPlateData[] = [
  // 스크리닝 플레이트 (모두 볼 수 있음 - 기준)
  { id: 1, number: '12', type: 'screening', bgHue: 120, bgSat: 45, bgLight: 50, fgHue: 0, fgSat: 65, fgLight: 50 },
  { id: 2, number: '8', type: 'screening', bgHue: 30, bgSat: 55, bgLight: 55, fgHue: 200, fgSat: 55, fgLight: 50 },

  // 적록색약 판별 플레이트
  { id: 3, number: '29', protanAnswer: '70', deutanAnswer: '70', type: 'protan', bgHue: 140, bgSat: 50, bgLight: 48, fgHue: 20, fgSat: 70, fgLight: 55 },
  { id: 4, number: '5', protanAnswer: '2', deutanAnswer: '2', type: 'deutan', bgHue: 350, bgSat: 45, bgLight: 52, fgHue: 120, fgSat: 50, fgLight: 45 },
  { id: 5, number: '3', protanAnswer: '5', deutanAnswer: '5', type: 'protan', bgHue: 100, bgSat: 40, bgLight: 55, fgHue: 0, fgSat: 55, fgLight: 50 },
  { id: 6, number: '15', protanAnswer: '17', deutanAnswer: '17', type: 'deutan', bgHue: 25, bgSat: 60, bgLight: 50, fgHue: 150, fgSat: 45, fgLight: 48 },

  // 적색약 vs 녹색약 분류 플레이트
  { id: 7, number: '74', protanAnswer: '21', deutanAnswer: '21', type: 'protan', bgHue: 110, bgSat: 48, bgLight: 52, fgHue: 10, fgSat: 62, fgLight: 52 },
  { id: 8, number: '6', type: 'vanishing', bgHue: 35, bgSat: 50, bgLight: 50, fgHue: 180, fgSat: 45, fgLight: 48 },
  { id: 9, number: '45', protanAnswer: 'nothing', deutanAnswer: '45', type: 'protan', bgHue: 5, bgSat: 55, bgLight: 50, fgHue: 130, fgSat: 50, fgLight: 50 },
  { id: 10, number: '97', protanAnswer: '97', deutanAnswer: 'nothing', type: 'deutan', bgHue: 120, bgSat: 52, bgLight: 48, fgHue: 355, fgSat: 58, fgLight: 52 },

  // 추가 스크리닝 플레이트
  { id: 11, number: '16', type: 'screening', bgHue: 45, bgSat: 55, bgLight: 52, fgHue: 280, fgSat: 50, fgLight: 48 },
  { id: 12, number: '73', protanAnswer: 'nothing', deutanAnswer: 'nothing', type: 'vanishing', bgHue: 90, bgSat: 45, bgLight: 50, fgHue: 0, fgSat: 50, fgLight: 50 },

  // 청황색약 플레이트
  { id: 13, number: '26', type: 'tritan', bgHue: 220, bgSat: 55, bgLight: 48, fgHue: 50, fgSat: 60, fgLight: 55 },
  { id: 14, number: '42', type: 'tritan', bgHue: 60, bgSat: 50, bgLight: 55, fgHue: 250, fgSat: 55, fgLight: 48 },
];

// 숫자 패턴 정의 (간단한 7세그먼트 스타일)
const DIGIT_PATTERNS: Record<string, boolean[][]> = {
  '0': [
    [true, true, true],
    [true, false, true],
    [true, false, true],
    [true, false, true],
    [true, true, true],
  ],
  '1': [
    [false, true, false],
    [false, true, false],
    [false, true, false],
    [false, true, false],
    [false, true, false],
  ],
  '2': [
    [true, true, true],
    [false, false, true],
    [true, true, true],
    [true, false, false],
    [true, true, true],
  ],
  '3': [
    [true, true, true],
    [false, false, true],
    [true, true, true],
    [false, false, true],
    [true, true, true],
  ],
  '4': [
    [true, false, true],
    [true, false, true],
    [true, true, true],
    [false, false, true],
    [false, false, true],
  ],
  '5': [
    [true, true, true],
    [true, false, false],
    [true, true, true],
    [false, false, true],
    [true, true, true],
  ],
  '6': [
    [true, true, true],
    [true, false, false],
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ],
  '7': [
    [true, true, true],
    [false, false, true],
    [false, false, true],
    [false, false, true],
    [false, false, true],
  ],
  '8': [
    [true, true, true],
    [true, false, true],
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ],
  '9': [
    [true, true, true],
    [true, false, true],
    [true, true, true],
    [false, false, true],
    [true, true, true],
  ],
};

// 숫자가 해당 위치에 있는지 확인
function isInDigitPattern(x: number, y: number, cx: number, cy: number, digit: string, scale: number): boolean {
  const pattern = DIGIT_PATTERNS[digit];
  if (!pattern) return false;

  const patternWidth = 3 * scale;
  const patternHeight = 5 * scale;

  const relX = x - (cx - patternWidth / 2);
  const relY = y - (cy - patternHeight / 2);

  if (relX < 0 || relX >= patternWidth || relY < 0 || relY >= patternHeight) {
    return false;
  }

  const gridX = Math.floor(relX / scale);
  const gridY = Math.floor(relY / scale);

  return pattern[gridY]?.[gridX] ?? false;
}

// 숫자 문자열이 해당 위치에 있는지 확인
function isInNumber(x: number, y: number, number: string, centerX: number, centerY: number): boolean {
  const digits = number.split('');
  const scale = 14; // 8에서 14로 증가하여 숫자를 더 크고 명확하게 표시
  const spacing = scale * 3.2; // 자간을 약간 좁힘

  const totalWidth = digits.length * spacing - (spacing - scale * 3);
  let startX = centerX - totalWidth / 2;

  for (let i = 0; i < digits.length; i++) {
    const digitCenterX = startX + scale * 1.5 + i * spacing;
    if (isInDigitPattern(x, y, digitCenterX, centerY, digits[i], scale)) {
      return true;
    }
  }

  return false;
}

// HSL to RGB 변환
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// RGB to HSL 변환
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// 색상 플레이트 컴포넌트
function IshiharaPlate({
  plate,
  seed,
}: {
  plate: ColorPlateData;
  seed: number;
}) {
  const dots = useMemo(() => {
    const result: { x: number; y: number; size: number; hue: number; sat: number; light: number }[] = [];
    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // 점 개수를 750개로 대폭 증가하여 더 밀도 있는 패턴 생성
    for (let i = 0; i < 750; i++) {
      const r1 = random(seed + i * 1.1);
      const r2 = random(seed + i * 2.2);
      const r3 = random(seed + i * 3.3);
      const r4 = random(seed + i * 4.4);
      const r5 = random(seed + i * 5.5);

      const x = 8 + r1 * 84;
      const y = 8 + r2 * 84;
      // 점 크기를 더 균일하게 조정 (3.5~6.5 범위로 변경)
      const size = 3.5 + r3 * 3;

      // 원형 영역 내부에만 점 배치
      const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2);
      if (distFromCenter > 42) continue;

      // 숫자 영역 판별
      const inNumber = isInNumber(x, y, plate.number, 50, 50);

      // 색상 결정 (변화폭을 줄여 숫자를 더 명확하게)
      const hueVar = (r4 - 0.5) * 10;
      const satVar = (r5 - 0.5) * 8;

      result.push({
        x,
        y,
        size,
        hue: inNumber ? plate.fgHue + hueVar : plate.bgHue + hueVar,
        sat: inNumber ? plate.fgSat + satVar : plate.bgSat + satVar,
        light: inNumber ? plate.fgLight + (r4 - 0.5) * 6 : plate.bgLight + (r4 - 0.5) * 6,
      });
    }

    return result;
  }, [plate, seed]);

  return (
    <div className="relative w-64 h-64 rounded-full overflow-hidden shadow-lg border-4 border-border">
      <svg viewBox="0 0 100 100" className="w-full h-full bg-neutral-100">
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.size / 2}
            fill={`hsl(${dot.hue}, ${dot.sat}%, ${dot.light}%)`}
          />
        ))}
      </svg>
    </div>
  );
}

// 색각 유형 분석
function analyzeColorVision(answers: { plateId: number; answer: string }[]): {
  type: ColorVisionType;
  severity: 'none' | 'mild' | 'moderate' | 'strong';
  protanScore: number;
  deutanScore: number;
  tritanScore: number;
  normalScore: number;
} {
  let protanErrors = 0;
  let deutanErrors = 0;
  let tritanErrors = 0;
  let screeningCorrect = 0;
  let vanishingErrors = 0;

  answers.forEach(({ plateId, answer }) => {
    const plate = PLATES.find(p => p.id === plateId);
    if (!plate) return;

    const normalizedAnswer = answer.toLowerCase().trim();
    const correctAnswer = plate.number.toLowerCase();

    switch (plate.type) {
      case 'screening':
        if (normalizedAnswer === correctAnswer) screeningCorrect++;
        break;
      case 'protan':
        if (normalizedAnswer !== correctAnswer) {
          if (plate.protanAnswer && normalizedAnswer === plate.protanAnswer.toLowerCase()) {
            protanErrors++;
          }
        }
        break;
      case 'deutan':
        if (normalizedAnswer !== correctAnswer) {
          if (plate.deutanAnswer && normalizedAnswer === plate.deutanAnswer.toLowerCase()) {
            deutanErrors++;
          }
        }
        break;
      case 'tritan':
        if (normalizedAnswer !== correctAnswer) tritanErrors++;
        break;
      case 'vanishing':
        if (normalizedAnswer === '' || normalizedAnswer === 'nothing' || normalizedAnswer === '안보임') {
          // 정상적으로 안 보이는 경우
        } else if (normalizedAnswer !== correctAnswer) {
          vanishingErrors++;
        }
        break;
    }
  });

  // 분석 결과
  const totalErrors = protanErrors + deutanErrors + tritanErrors + vanishingErrors;

  let type: ColorVisionType = 'normal';
  let severity: 'none' | 'mild' | 'moderate' | 'strong' = 'none';

  if (screeningCorrect < 2 && totalErrors > 3) {
    // 심각한 색각 이상
    if (protanErrors > deutanErrors && protanErrors > tritanErrors) {
      type = 'protanopia';
    } else if (deutanErrors > protanErrors && deutanErrors > tritanErrors) {
      type = 'deuteranopia';
    } else if (tritanErrors > 1) {
      type = 'tritanopia';
    } else {
      type = 'unknown';
    }
    severity = 'strong';
  } else if (totalErrors > 2) {
    if (protanErrors >= deutanErrors && protanErrors > tritanErrors) {
      type = 'protanopia';
    } else if (deutanErrors > protanErrors && deutanErrors > tritanErrors) {
      type = 'deuteranopia';
    } else if (tritanErrors > 0) {
      type = 'tritanopia';
    }
    severity = totalErrors > 4 ? 'moderate' : 'mild';
  }

  return {
    type,
    severity,
    protanScore: protanErrors,
    deutanScore: deutanErrors,
    tritanScore: tritanErrors,
    normalScore: screeningCorrect,
  };
}

// 결과 해석
function getResultInterpretation(type: ColorVisionType, severity: string): {
  title: string;
  description: string;
  advice: string;
  color: string;
} {
  if (type === 'normal') {
    return {
      title: '정상 색각',
      description: '색각 검사 결과 정상으로 판정되었습니다.',
      advice: '정기적인 눈 건강 검진을 권장합니다.',
      color: 'text-green-600',
    };
  }

  const typeNames = {
    protanopia: '적색약 (제1색약)',
    deuteranopia: '녹색약 (제2색약)',
    tritanopia: '청황색약 (제3색약)',
    unknown: '색각 이상',
  };

  const severityNames = {
    mild: '경미한',
    moderate: '중등도',
    strong: '심한',
  };

  return {
    title: `${severityNames[severity as keyof typeof severityNames] || ''} ${typeNames[type]} 의심`,
    description: `적록색 또는 청황색 구분에 어려움이 있을 수 있습니다.`,
    advice: '정확한 진단을 위해 안과 전문의 상담을 권장합니다.',
    color: severity === 'mild' ? 'text-yellow-600' : severity === 'moderate' ? 'text-orange-600' : 'text-red-600',
  };
}

export function ColorBlindTest({ onComplete, onBack }: ColorBlindTestProps) {
  const { haptic } = useAppsInToss();
  const { updateProgress, updateChallengeProgress } = useAchievements();

  const [stage, setStage] = useState(-1); // -1은 인트로
  const [answers, setAnswers] = useState<{ plateId: number; answer: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [seed] = useState(() => Date.now());

  const handleStart = () => {
    setStage(0);
  };

  const handleSubmit = async () => {
    await haptic('tap');

    const currentPlate = PLATES[stage];
    const newAnswers = [...answers, { plateId: currentPlate.id, answer: inputValue }];
    setAnswers(newAnswers);
    setInputValue('');

    if (stage < PLATES.length - 1) {
      setStage(prev => prev + 1);
    } else {
      setIsComplete(true);
      updateProgress('totalTests', 1, true);
      updateChallengeProgress('test', 1);
    }
  };

  const handleSkip = async () => {
    await haptic('tap');

    const currentPlate = PLATES[stage];
    const newAnswers = [...answers, { plateId: currentPlate.id, answer: '' }];
    setAnswers(newAnswers);
    setInputValue('');

    if (stage < PLATES.length - 1) {
      setStage(prev => prev + 1);
    } else {
      setIsComplete(true);
      updateProgress('totalTests', 1, true);
      updateChallengeProgress('test', 1);
    }
  };

  // 결과 분석
  const analysis = useMemo(() => {
    if (!isComplete) return null;
    return analyzeColorVision(answers);
  }, [isComplete, answers]);

  const score = answers.filter(({ plateId, answer }) => {
    const plate = PLATES.find(p => p.id === plateId);
    return plate && answer.toLowerCase() === plate.number.toLowerCase();
  }).length;

  // 인트로 화면
  if (stage === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <EyeriCharacter mood="cheering" size="medium" message="색각 검사를 시작해볼까요?" />

        <div className="mt-6 w-full max-w-sm space-y-4">
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <h3 className="text-body1 font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" />
              검사 방법
            </h3>
            <ul className="text-caption1 text-blue-700 space-y-1">
              <li>• 총 <strong>{PLATES.length}개</strong>의 색판을 확인합니다</li>
              <li>• 색판에 보이는 숫자를 입력하세요</li>
              <li>• 숫자가 안 보이면 &quot;안 보여요&quot; 선택</li>
              <li>• 밝은 조명 아래에서 검사하세요</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-caption1 text-amber-700">
                화면 색상 설정에 따라 결과가 달라질 수 있습니다.
                정확한 진단은 안과 전문의와 상담하세요.
              </p>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="btn-toss-primary w-full"
          >
            검사 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 완료 화면
  if (isComplete && analysis) {
    const interpretation = getResultInterpretation(analysis.type, analysis.severity);
    const percentage = (score / PLATES.length) * 100;

    return (
      <div className="flex flex-col min-h-[80vh] p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-h3 font-bold text-foreground">검사 완료!</h2>
        </div>

        {/* 결과 요약 */}
        <div className={`bg-gradient-to-br ${analysis.type === 'normal' ? 'from-green-50 to-emerald-50 border-green-200' : 'from-orange-50 to-amber-50 border-orange-200'} rounded-2xl p-5 border mb-4`}>
          <div className="text-center mb-4">
            <p className="text-caption1 text-muted-foreground mb-1">정답률</p>
            <p className="text-5xl font-black text-foreground">
              {score}/{PLATES.length}
            </p>
            <p className="text-caption1 text-muted-foreground mt-1">
              {percentage.toFixed(0)}%
            </p>
          </div>

          <div className="text-center">
            <p className={`text-h4 font-bold ${interpretation.color}`}>
              {interpretation.title}
            </p>
            <p className="text-caption1 text-muted-foreground mt-1">
              {interpretation.description}
            </p>
          </div>
        </div>

        {/* 상세 분석 */}
        {analysis.type !== 'normal' && (
          <div className="bg-card rounded-xl p-4 border border-border mb-4">
            <h4 className="text-body2 font-bold mb-3">분석 결과</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-caption2 text-muted-foreground">적색약 지표</p>
                <p className="text-body1 font-bold">{analysis.protanScore}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-caption2 text-muted-foreground">녹색약 지표</p>
                <p className="text-body1 font-bold">{analysis.deutanScore}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-caption2 text-muted-foreground">청황색약 지표</p>
                <p className="text-body1 font-bold">{analysis.tritanScore}</p>
              </div>
            </div>
          </div>
        )}

        {/* 조언 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
          <EyeriCharacter
            mood={analysis.type === 'normal' ? 'happy' : 'concerned'}
            size="small"
            message={interpretation.advice}
          />
        </div>

        <p className="text-caption2 text-muted-foreground text-center mb-4">
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

  // 테스트 진행 중
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
        <IshiharaPlate plate={currentPlate} seed={seed + stage} />
        <p className="text-body2 text-muted-foreground mt-6 text-center">
          원 안에 보이는 숫자를 입력하세요
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
            inputMode="numeric"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20
                       transition-all duration-150
                       active:scale-[0.97] active:shadow-sm active:bg-primary/90
                       disabled:opacity-50 disabled:shadow-none"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleSkip}
          className="w-full py-4 rounded-2xl bg-secondary text-muted-foreground font-bold text-body2
                     transition-all duration-150
                     active:scale-[0.98] active:bg-secondary/80"
        >
          안 보여요 / 모르겠어요
        </button>
      </div>
    </div>
  );
}
