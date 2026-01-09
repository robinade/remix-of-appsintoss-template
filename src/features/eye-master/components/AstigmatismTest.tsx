/**
 * Enhanced Astigmatism Test with Visual Distortion Simulation
 *
 * Features:
 * - Visual distortion simulation using CSS blur filters
 * - Interactive axis detection (0-180 degrees)
 * - Severity estimation (mild, moderate, significant)
 * - Left/Right eye testing
 * - Amsler grid test for macular health
 * - Integration with Eyeri character and achievements
 */

import { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, Target, Info, Eye, AlertTriangle, Grid3X3, RotateCcw, ChevronRight } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { useAchievements } from '../hooks/useAchievements';
import { EyeriHappy, EyeriExcited, EyeriTip } from './EyeriCharacter';

interface AstigmatismTestProps {
  onComplete: (result: AstigmatismResult) => void;
  onBack: () => void;
}

export interface AstigmatismResult {
  hasAstigmatism: boolean;
  axis: number; // Primary axis in degrees (0-180)
  estimatedCylinder: 'none' | 'mild' | 'moderate' | 'significant';
  affectedMeridians: number[];
  leftEye: EyeResult | null;
  rightEye: EyeResult | null;
  amslerResult: AmslerResult | null;
}

interface EyeResult {
  hasAstigmatism: boolean;
  axis: number;
  severity: 'none' | 'mild' | 'moderate' | 'significant';
  blurryLines: number[];
  clearestLine: number | null;
}

interface AmslerResult {
  hasDistortion: boolean;
  distortionAreas: { x: number; y: number }[];
  missingAreas: { x: number; y: number }[];
}

type Stage =
  | 'intro'
  | 'simulation-demo'
  | 'left-eye-intro'
  | 'left-eye-test'
  | 'right-eye-intro'
  | 'right-eye-test'
  | 'amsler-intro'
  | 'amsler-test'
  | 'result';

type TestMode = 'clearest' | 'blurriest';

// 12 meridian lines for comprehensive testing (every 15 degrees)
const MERIDIAN_ANGLES = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];

// Blur levels for simulation demo
const BLUR_DEMO_LEVELS = [0, 1, 2, 3, 4];

export function AstigmatismTest({ onComplete, onBack }: AstigmatismTestProps) {
  const { haptic } = useAppsInToss();
  const { updateProgress } = useAchievements();

  const [stage, setStage] = useState<Stage>('intro');
  const [testMode, setTestMode] = useState<TestMode>('clearest');

  // Test results for each eye
  const [leftEyeResult, setLeftEyeResult] = useState<EyeResult | null>(null);
  const [rightEyeResult, setRightEyeResult] = useState<EyeResult | null>(null);

  // Current test state
  const [selectedClearest, setSelectedClearest] = useState<number | null>(null);
  const [selectedBlurry, setSelectedBlurry] = useState<number[]>([]);

  // Amsler grid state
  const [amslerDistortions, setAmslerDistortions] = useState<{ x: number; y: number }[]>([]);
  const [amslerMissing, setAmslerMissing] = useState<{ x: number; y: number }[]>([]);

  // Simulation demo state
  const [demoBlurLevel, setDemoBlurLevel] = useState(2);
  const [demoAxis, setDemoAxis] = useState(90);

  const resetTestState = useCallback(() => {
    setSelectedClearest(null);
    setSelectedBlurry([]);
    setTestMode('clearest');
  }, []);

  const handleLineSelect = async (angle: number) => {
    await haptic('tap');

    if (testMode === 'clearest') {
      setSelectedClearest(angle);
      // Auto-advance to blurriest selection
      setTestMode('blurriest');
    } else {
      // Toggle blurry line selection
      if (selectedBlurry.includes(angle)) {
        setSelectedBlurry(prev => prev.filter(a => a !== angle));
      } else if (angle !== selectedClearest) {
        setSelectedBlurry(prev => [...prev, angle]);
      }
    }
  };

  const calculateSeverity = (blurryCount: number): 'none' | 'mild' | 'moderate' | 'significant' => {
    if (blurryCount === 0) return 'none';
    if (blurryCount <= 2) return 'mild';
    if (blurryCount <= 4) return 'moderate';
    return 'significant';
  };

  const calculateAxis = (clearestLine: number | null, blurryLines: number[]): number => {
    if (clearestLine !== null) {
      // The axis is perpendicular to the clearest meridian
      return (clearestLine + 90) % 180;
    }
    if (blurryLines.length > 0) {
      // Average of blurry lines indicates the axis
      const sum = blurryLines.reduce((a, b) => a + b, 0);
      return Math.round(sum / blurryLines.length) % 180;
    }
    return 0;
  };

  const completeEyeTest = async (eye: 'left' | 'right') => {
    await haptic('success');

    const result: EyeResult = {
      hasAstigmatism: selectedClearest !== null || selectedBlurry.length > 0,
      axis: calculateAxis(selectedClearest, selectedBlurry),
      severity: calculateSeverity(selectedBlurry.length),
      blurryLines: [...selectedBlurry],
      clearestLine: selectedClearest,
    };

    if (eye === 'left') {
      setLeftEyeResult(result);
      resetTestState();
      setStage('right-eye-intro');
    } else {
      setRightEyeResult(result);
      resetTestState();
      setStage('amsler-intro');
    }
  };

  const handleAmslerGridClick = async (x: number, y: number) => {
    await haptic('tap');

    const existing = amslerDistortions.find(p => p.x === x && p.y === y);
    if (existing) {
      setAmslerDistortions(prev => prev.filter(p => !(p.x === x && p.y === y)));
    } else {
      setAmslerDistortions(prev => [...prev, { x, y }]);
    }
  };

  const completeAmslerTest = async () => {
    await haptic('success');

    const amslerResult: AmslerResult = {
      hasDistortion: amslerDistortions.length > 0 || amslerMissing.length > 0,
      distortionAreas: [...amslerDistortions],
      missingAreas: [...amslerMissing],
    };

    // Calculate final result
    const hasAstigmatismLeft = leftEyeResult?.hasAstigmatism ?? false;
    const hasAstigmatismRight = rightEyeResult?.hasAstigmatism ?? false;
    const hasAstigmatism = hasAstigmatismLeft || hasAstigmatismRight;

    // Combine affected meridians from both eyes
    const affectedMeridians = [
      ...(leftEyeResult?.blurryLines ?? []),
      ...(rightEyeResult?.blurryLines ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i);

    // Determine primary axis (average of both eyes if both have astigmatism)
    let primaryAxis = 0;
    if (hasAstigmatismLeft && hasAstigmatismRight) {
      primaryAxis = Math.round((leftEyeResult!.axis + rightEyeResult!.axis) / 2);
    } else if (hasAstigmatismLeft) {
      primaryAxis = leftEyeResult!.axis;
    } else if (hasAstigmatismRight) {
      primaryAxis = rightEyeResult!.axis;
    }

    // Determine overall severity (worst case)
    const severities = ['none', 'mild', 'moderate', 'significant'] as const;
    const leftSevIdx = severities.indexOf(leftEyeResult?.severity ?? 'none');
    const rightSevIdx = severities.indexOf(rightEyeResult?.severity ?? 'none');
    const overallSeverity = severities[Math.max(leftSevIdx, rightSevIdx)];

    const finalResult: AstigmatismResult = {
      hasAstigmatism,
      axis: primaryAxis,
      estimatedCylinder: overallSeverity,
      affectedMeridians,
      leftEye: leftEyeResult,
      rightEye: rightEyeResult,
      amslerResult,
    };

    // Update achievements
    updateProgress('totalTests', 1);

    setStage('result');

    // Store result for display, then pass to parent
    setTimeout(() => {
      onComplete(finalResult);
    }, 100);
  };

  const finalResult = useMemo((): AstigmatismResult | null => {
    if (stage !== 'result') return null;

    const hasAstigmatismLeft = leftEyeResult?.hasAstigmatism ?? false;
    const hasAstigmatismRight = rightEyeResult?.hasAstigmatism ?? false;
    const hasAstigmatism = hasAstigmatismLeft || hasAstigmatismRight;

    const affectedMeridians = [
      ...(leftEyeResult?.blurryLines ?? []),
      ...(rightEyeResult?.blurryLines ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i);

    let primaryAxis = 0;
    if (hasAstigmatismLeft && hasAstigmatismRight) {
      primaryAxis = Math.round((leftEyeResult!.axis + rightEyeResult!.axis) / 2);
    } else if (hasAstigmatismLeft) {
      primaryAxis = leftEyeResult!.axis;
    } else if (hasAstigmatismRight) {
      primaryAxis = rightEyeResult!.axis;
    }

    const severities = ['none', 'mild', 'moderate', 'significant'] as const;
    const leftSevIdx = severities.indexOf(leftEyeResult?.severity ?? 'none');
    const rightSevIdx = severities.indexOf(rightEyeResult?.severity ?? 'none');
    const overallSeverity = severities[Math.max(leftSevIdx, rightSevIdx)];

    return {
      hasAstigmatism,
      axis: primaryAxis,
      estimatedCylinder: overallSeverity,
      affectedMeridians,
      leftEye: leftEyeResult,
      rightEye: rightEyeResult,
      amslerResult: {
        hasDistortion: amslerDistortions.length > 0 || amslerMissing.length > 0,
        distortionAreas: amslerDistortions,
        missingAreas: amslerMissing,
      },
    };
  }, [stage, leftEyeResult, rightEyeResult, amslerDistortions, amslerMissing]);

  // ===== RENDER FUNCTIONS =====

  const renderIntro = () => (
    <div className="flex flex-col min-h-[80vh] p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-6">
          <EyeriTip tip="난시가 무엇인지 함께 알아볼까요?" size="large" />
        </div>

        <h2 className="text-title2 text-foreground mb-4 text-center">
          난시 정밀 검사
        </h2>

        <div className="bg-secondary rounded-2xl p-5 w-full max-w-sm mb-6">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-body2 text-foreground font-medium mb-2">검사 과정</p>
              <ol className="text-caption1 text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  난시 시뮬레이션 체험
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  왼쪽 눈 검사
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  오른쪽 눈 검사
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                  암슬러 격자 검사
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-warning/10 rounded-xl p-4 w-full max-w-sm">
          <p className="text-caption1 text-warning text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            안경/렌즈 착용자는 벗고 테스트하세요
          </p>
        </div>
      </div>

      <button
        onClick={() => setStage('simulation-demo')}
        className="btn-toss-primary w-full"
      >
        시작하기
      </button>
    </div>
  );

  const renderSimulationDemo = () => (
    <div className="flex flex-col min-h-[80vh] p-6">
      <div className="text-center mb-6">
        <h2 className="text-title3 text-foreground mb-2">난시는 이렇게 보여요</h2>
        <p className="text-caption1 text-muted-foreground">
          슬라이더를 움직여 난시가 있는 시야를 체험해보세요
        </p>
      </div>

      {/* Demo Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative w-72 h-72">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="white" stroke="hsl(var(--border))" strokeWidth="1" />

            {/* Radial lines with directional blur effect */}
            {MERIDIAN_ANGLES.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 40 * Math.cos(rad);
              const y1 = 50 + 40 * Math.sin(rad);
              const x2 = 50 - 40 * Math.cos(rad);
              const y2 = 50 - 40 * Math.sin(rad);

              // Calculate blur based on angle difference from demo axis
              const angleDiff = Math.abs(((angle - demoAxis + 180) % 180) - 90);
              const normalizedDiff = angleDiff / 90; // 0 to 1
              const blur = (1 - normalizedDiff) * demoBlurLevel * 0.5;

              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2"
                  style={{ filter: `blur(${blur}px)` }}
                />
              );
            })}

            <circle cx="50" cy="50" r="3" fill="hsl(var(--primary))" />
          </svg>
        </div>

        {/* Controls */}
        <div className="w-full max-w-sm space-y-4">
          <div>
            <div className="flex justify-between text-caption1 mb-2">
              <span className="text-muted-foreground">난시 강도</span>
              <span className="text-foreground font-medium">
                {demoBlurLevel === 0 ? '정상' :
                 demoBlurLevel <= 1 ? '경미' :
                 demoBlurLevel <= 2 ? '중간' : '심함'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={demoBlurLevel}
              onChange={(e) => setDemoBlurLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-caption1 mb-2">
              <span className="text-muted-foreground">난시 축</span>
              <span className="text-foreground font-medium">{demoAxis}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="15"
              value={demoAxis}
              onChange={(e) => setDemoAxis(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <p className="text-caption1 text-muted-foreground text-center max-w-sm">
          난시가 있으면 특정 방향의 선이 흐리게 보입니다.
          모든 선이 선명하게 보인다면 난시가 없는 것입니다.
        </p>
      </div>

      <button
        onClick={() => setStage('left-eye-intro')}
        className="btn-toss-primary w-full flex items-center justify-center gap-2"
      >
        검사 시작하기
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderEyeIntro = (eye: 'left' | 'right') => (
    <div className="flex flex-col min-h-[80vh] p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className={`w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center ${
            eye === 'left' ? '' : 'scale-x-[-1]'
          }`}>
            <Eye className="w-16 h-16 text-primary" />
          </div>
          {/* Cover indicator */}
          <div className={`absolute ${eye === 'left' ? '-right-4' : '-left-4'} top-1/2 -translate-y-1/2`}>
            <div className="bg-destructive/20 text-destructive text-caption2 px-3 py-1 rounded-full">
              {eye === 'left' ? '오른쪽 가림' : '왼쪽 가림'}
            </div>
          </div>
        </div>

        <h2 className="text-title2 text-foreground mb-2">
          {eye === 'left' ? '왼쪽' : '오른쪽'} 눈 검사
        </h2>

        <p className="text-body2 text-muted-foreground text-center mb-6 max-w-sm">
          {eye === 'left' ? '오른쪽' : '왼쪽'} 눈을 손으로 가리고
          <br />방사형 선을 바라봐 주세요
        </p>

        <div className="bg-secondary rounded-xl p-4 w-full max-w-sm">
          <ol className="text-caption1 text-muted-foreground space-y-2">
            <li>1. 가장 선명하게 보이는 선을 선택하세요</li>
            <li>2. 그 다음, 흐리게 보이는 선들을 선택하세요</li>
            <li>3. 모두 동일하게 보이면 바로 완료를 누르세요</li>
          </ol>
        </div>
      </div>

      <button
        onClick={() => setStage(eye === 'left' ? 'left-eye-test' : 'right-eye-test')}
        className="btn-toss-primary w-full"
      >
        검사 시작
      </button>
    </div>
  );

  const renderEyeTest = (eye: 'left' | 'right') => (
    <div className="flex flex-col min-h-[80vh]">
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Eye className={`w-5 h-5 text-primary ${eye === 'right' ? 'scale-x-[-1]' : ''}`} />
          <span className="text-body2 text-foreground font-medium">
            {eye === 'left' ? '왼쪽' : '오른쪽'} 눈 검사
          </span>
        </div>
        <p className="text-caption1 text-primary font-medium">
          {testMode === 'clearest'
            ? '가장 선명한 선을 선택하세요'
            : '흐리게 보이는 선들을 모두 선택하세요'}
        </p>
        {testMode === 'blurriest' && (
          <p className="text-caption2 text-muted-foreground mt-1">
            모두 동일하다면 바로 완료를 누르세요
          </p>
        )}
      </div>

      {/* Radial lines test */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-80 h-80">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="white"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
            />

            {/* Radial lines */}
            {MERIDIAN_ANGLES.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 44 * Math.cos(rad);
              const y1 = 50 + 44 * Math.sin(rad);
              const x2 = 50 - 44 * Math.cos(rad);
              const y2 = 50 - 44 * Math.sin(rad);

              const isClearest = selectedClearest === angle;
              const isBlurry = selectedBlurry.includes(angle);

              let strokeColor = 'hsl(var(--foreground))';
              let strokeWidth = '1.5';

              if (isClearest) {
                strokeColor = 'hsl(var(--success))';
                strokeWidth = '2.5';
              } else if (isBlurry) {
                strokeColor = 'hsl(var(--warning))';
                strokeWidth = '2';
              }

              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleLineSelect(angle)}
                />
              );
            })}

            {/* Center point */}
            <circle cx="50" cy="50" r="2" fill="hsl(var(--destructive))" />
            <circle cx="50" cy="50" r="5" fill="none" stroke="hsl(var(--destructive))" strokeWidth="0.5" />
          </svg>

          {/* Angle buttons */}
          {MERIDIAN_ANGLES.map((angle) => {
            const displayAngle = angle > 90 ? angle - 180 : angle;
            const rad = ((angle - 90) * Math.PI) / 180;
            const x = 50 + 58 * Math.cos(rad);
            const y = 50 + 58 * Math.sin(rad);

            const isClearest = selectedClearest === angle;
            const isBlurry = selectedBlurry.includes(angle);

            return (
              <button
                key={angle}
                onClick={() => handleLineSelect(angle)}
                className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                  isClearest
                    ? 'bg-success text-success-foreground scale-110'
                    : isBlurry
                    ? 'bg-warning text-warning-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Math.abs(displayAngle)}°
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex justify-center gap-4 text-caption2">
        {selectedClearest !== null && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-success" />
            선명: {selectedClearest}°
          </span>
        )}
        {selectedBlurry.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-warning" />
            흐림: {selectedBlurry.length}개
          </span>
        )}
      </div>

      <div className="p-4 flex gap-3">
        <button
          onClick={resetTestState}
          className="btn-toss-secondary flex-1 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          다시 선택
        </button>
        <button
          onClick={() => completeEyeTest(eye)}
          className="btn-toss-primary flex-1"
        >
          검사 완료
        </button>
      </div>
    </div>
  );

  const renderAmslerIntro = () => (
    <div className="flex flex-col min-h-[80vh] p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Grid3X3 className="w-10 h-10 text-primary" />
        </div>

        <h2 className="text-title2 text-foreground mb-2">암슬러 격자 검사</h2>

        <p className="text-body2 text-muted-foreground text-center mb-6 max-w-sm">
          황반변성 등 망막 이상을 조기 발견하는
          <br />중요한 검사입니다
        </p>

        <div className="bg-secondary rounded-xl p-4 w-full max-w-sm mb-6">
          <ol className="text-caption1 text-muted-foreground space-y-2">
            <li>1. 중앙의 빨간 점을 응시하세요</li>
            <li>2. 격자 선이 휘어지거나 물결치는 부분을 탭하세요</li>
            <li>3. 선이 끊어지거나 안 보이는 부분도 탭하세요</li>
          </ol>
        </div>

        <div className="bg-warning/10 rounded-xl p-4 w-full max-w-sm">
          <p className="text-caption1 text-warning text-center">
            양쪽 눈으로 검사합니다 (안경 착용 가능)
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            // Skip Amsler and go to results
            completeAmslerTest();
          }}
          className="btn-toss-secondary flex-1"
        >
          건너뛰기
        </button>
        <button
          onClick={() => setStage('amsler-test')}
          className="btn-toss-primary flex-1"
        >
          검사 시작
        </button>
      </div>
    </div>
  );

  const renderAmslerTest = () => {
    const gridSize = 9; // 9x9 grid

    return (
      <div className="flex flex-col min-h-[80vh]">
        <div className="p-4 text-center">
          <p className="text-body2 text-foreground font-medium">
            중앙 점을 응시하며 이상한 부분을 탭하세요
          </p>
          <p className="text-caption1 text-muted-foreground mt-1">
            선이 휘거나, 끊기거나, 안 보이는 곳
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg p-2 shadow-lg">
            <svg width="280" height="280" viewBox="0 0 280 280">
              {/* Grid lines - vertical */}
              {Array.from({ length: gridSize + 1 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * (280 / gridSize)}
                  y1="0"
                  x2={i * (280 / gridSize)}
                  y2="280"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="0.5"
                />
              ))}

              {/* Grid lines - horizontal */}
              {Array.from({ length: gridSize + 1 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * (280 / gridSize)}
                  x2="280"
                  y2={i * (280 / gridSize)}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="0.5"
                />
              ))}

              {/* Center fixation point */}
              <circle cx="140" cy="140" r="5" fill="hsl(var(--destructive))" />

              {/* Clickable cells overlay */}
              {Array.from({ length: gridSize }).map((_, row) =>
                Array.from({ length: gridSize }).map((_, col) => {
                  const x = col;
                  const y = row;
                  const isMarked = amslerDistortions.some(p => p.x === x && p.y === y);
                  const cellSize = 280 / gridSize;

                  return (
                    <rect
                      key={`cell-${row}-${col}`}
                      x={col * cellSize}
                      y={row * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={isMarked ? 'hsl(var(--warning) / 0.4)' : 'transparent'}
                      stroke={isMarked ? 'hsl(var(--warning))' : 'transparent'}
                      strokeWidth="1"
                      className="cursor-pointer"
                      onClick={() => handleAmslerGridClick(x, y)}
                    />
                  );
                })
              )}
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 py-2 text-center">
          {amslerDistortions.length > 0 ? (
            <p className="text-caption1 text-warning">
              {amslerDistortions.length}개 영역이 선택됨
            </p>
          ) : (
            <p className="text-caption1 text-muted-foreground">
              이상 없으면 바로 완료를 누르세요
            </p>
          )}
        </div>

        <div className="p-4 flex gap-3">
          <button
            onClick={() => {
              setAmslerDistortions([]);
              setAmslerMissing([]);
            }}
            className="btn-toss-secondary flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>
          <button
            onClick={completeAmslerTest}
            className="btn-toss-primary flex-1"
          >
            검사 완료
          </button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!finalResult) return null;

    const { hasAstigmatism, axis, estimatedCylinder, leftEye, rightEye, amslerResult } = finalResult;

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'none': return 'text-success';
        case 'mild': return 'text-warning';
        case 'moderate': return 'text-orange-500';
        case 'significant': return 'text-destructive';
        default: return 'text-muted-foreground';
      }
    };

    const getSeverityLabel = (severity: string) => {
      switch (severity) {
        case 'none': return '정상';
        case 'mild': return '경미';
        case 'moderate': return '중간';
        case 'significant': return '심함';
        default: return '-';
      }
    };

    return (
      <div className="flex flex-col min-h-[80vh] p-6">
        <div className="flex-1">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">
              {hasAstigmatism ? (
                <EyeriTip tip="안과 검진을 권장해요!" size="large" />
              ) : (
                <EyeriHappy message="건강한 눈이에요!" size="large" />
              )}
            </div>

            <h2 className="text-title2 text-foreground mb-2">검사 완료!</h2>

            <div className={`text-body1 font-semibold ${
              hasAstigmatism ? 'text-warning' : 'text-success'
            }`}>
              {hasAstigmatism ? '난시 의심' : '난시 의심 없음'}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-secondary rounded-2xl p-5 mb-4">
            <h3 className="text-body2 text-foreground font-medium mb-4">검사 결과 요약</h3>

            <div className="space-y-3">
              {/* Overall */}
              <div className="flex justify-between items-center">
                <span className="text-caption1 text-muted-foreground">종합 판정</span>
                <span className={`text-body2 font-semibold ${getSeverityColor(estimatedCylinder)}`}>
                  {getSeverityLabel(estimatedCylinder)}
                </span>
              </div>

              {hasAstigmatism && (
                <div className="flex justify-between items-center">
                  <span className="text-caption1 text-muted-foreground">추정 난시 축</span>
                  <span className="text-body2 text-foreground font-medium">{axis}°</span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-border my-2" />

              {/* Left Eye */}
              <div className="flex justify-between items-center">
                <span className="text-caption1 text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" /> 왼쪽 눈
                </span>
                <span className={`text-caption1 font-medium ${getSeverityColor(leftEye?.severity ?? 'none')}`}>
                  {getSeverityLabel(leftEye?.severity ?? 'none')}
                  {leftEye?.hasAstigmatism && ` (${leftEye.axis}°)`}
                </span>
              </div>

              {/* Right Eye */}
              <div className="flex justify-between items-center">
                <span className="text-caption1 text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 scale-x-[-1]" /> 오른쪽 눈
                </span>
                <span className={`text-caption1 font-medium ${getSeverityColor(rightEye?.severity ?? 'none')}`}>
                  {getSeverityLabel(rightEye?.severity ?? 'none')}
                  {rightEye?.hasAstigmatism && ` (${rightEye.axis}°)`}
                </span>
              </div>

              {/* Amsler */}
              {amslerResult && (
                <>
                  <div className="border-t border-border my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-caption1 text-muted-foreground flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4" /> 암슬러 격자
                    </span>
                    <span className={`text-caption1 font-medium ${
                      amslerResult.hasDistortion ? 'text-warning' : 'text-success'
                    }`}>
                      {amslerResult.hasDistortion
                        ? `이상 발견 (${amslerResult.distortionAreas.length}곳)`
                        : '정상'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Warning Messages */}
          {(hasAstigmatism || amslerResult?.hasDistortion) && (
            <div className="bg-warning/10 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-caption1 text-warning">
                  <p className="font-medium mb-1">안과 검진을 권장합니다</p>
                  <p>
                    {hasAstigmatism && '난시가 의심됩니다. '}
                    {amslerResult?.hasDistortion && '암슬러 격자 검사에서 이상이 발견되었습니다. '}
                    정확한 진단과 교정을 위해 안과 전문의 상담을 권장합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-caption1 text-blue-700">
                이 검사는 참고용이며, 정확한 진단은 안과 전문의의 검사가 필요합니다.
                난시 축(axis)은 난시 교정 렌즈 처방 시 중요한 정보입니다.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onComplete(finalResult)}
          className="btn-toss-primary w-full mt-4"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  };

  // ===== MAIN RENDER =====

  switch (stage) {
    case 'intro':
      return renderIntro();
    case 'simulation-demo':
      return renderSimulationDemo();
    case 'left-eye-intro':
      return renderEyeIntro('left');
    case 'left-eye-test':
      return renderEyeTest('left');
    case 'right-eye-intro':
      return renderEyeIntro('right');
    case 'right-eye-test':
      return renderEyeTest('right');
    case 'amsler-intro':
      return renderAmslerIntro();
    case 'amsler-test':
      return renderAmslerTest();
    case 'result':
      return renderResult();
    default:
      return renderIntro();
  }
}
