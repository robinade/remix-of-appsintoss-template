/**
 * 사전 질문 컴포넌트 (시력 검사 전)
 *
 * 사용자의 나이, 안경 착용 여부 등을 수집하여
 * 결과 해석에 맥락 정보를 제공합니다.
 */

import { useState } from 'react';
import {
  ChevronRight,
  Glasses,
  Eye,
  AlertTriangle,
  CheckCircle2,
  User,
  Target,
} from 'lucide-react';
import { UserProfile, getRepresentativeAge, needsReadingGlasses } from '../types';
import { EyeriCharacter } from './EyeriCharacter';

interface PreTestQuestionnaireProps {
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void;
}

type Step = 'age' | 'glasses' | 'wearing' | 'purpose' | 'confirm';

const AGE_OPTIONS: { value: UserProfile['ageGroup']; label: string }[] = [
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대' },
  { value: '60plus', label: '60대+' },
];

const GLASSES_OPTIONS: { value: UserProfile['glassesType']; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'myopia',
    label: '근시용',
    icon: <Glasses className="w-5 h-5" />,
    description: '먼 것이 흐릿하게 보여서 착용',
  },
  {
    value: 'hyperopia',
    label: '원시/노안용',
    icon: <Eye className="w-5 h-5" />,
    description: '가까운 것이 흐릿하게 보여서 착용',
  },
  {
    value: 'multifocal',
    label: '다초점',
    icon: <Target className="w-5 h-5" />,
    description: '원거리/근거리 모두 교정',
  },
  {
    value: 'none',
    label: '착용 안함',
    icon: <User className="w-5 h-5" />,
    description: '평소 안경/렌즈 미착용',
  },
];

export function PreTestQuestionnaire({ onComplete, onSkip }: PreTestQuestionnaireProps) {
  const [step, setStep] = useState<Step>('age');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  // 경고 메시지 계산
  const getWarnings = (): string[] => {
    const warnings: string[] = [];

    if (profile.ageGroup) {
      const age = getRepresentativeAge(profile.ageGroup);

      // 50세 이상이고 안경을 착용하지 않는 경우
      if (age >= 50 && profile.glassesType === 'none') {
        warnings.push('40cm 거리에서 돋보기 없이 검사가 어려울 수 있습니다.');
      }

      // 45세 이상이고 안경 미착용인 경우
      if (age >= 45 && !profile.wearingNow && profile.glassesType !== 'none') {
        if (needsReadingGlasses(age)) {
          warnings.push('근거리 시력 측정 시 돋보기 착용을 권장합니다.');
        }
      }
    }

    // 근시용 안경 착용 중인 경우
    if (profile.glassesType === 'myopia' && profile.wearingNow) {
      warnings.push('40cm 거리에서 근거리 시력을 측정합니다.');
    }

    return warnings;
  };

  const handleAgeSelect = (ageGroup: UserProfile['ageGroup']) => {
    setProfile({ ...profile, ageGroup });
    setStep('glasses');
  };

  const handleGlassesSelect = (glassesType: UserProfile['glassesType']) => {
    setProfile({ ...profile, glassesType });
    if (glassesType === 'none') {
      setProfile({ ...profile, glassesType, wearingNow: false });
      setStep('purpose');
    } else {
      setStep('wearing');
    }
  };

  const handleWearingSelect = (wearingNow: boolean) => {
    setProfile({ ...profile, wearingNow });
    setStep('purpose');
  };

  const handlePurposeSelect = (testPurpose: UserProfile['testPurpose']) => {
    setProfile({ ...profile, testPurpose });
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (profile.ageGroup && profile.glassesType !== undefined && profile.testPurpose) {
      onComplete(profile as UserProfile);
    }
  };

  const renderProgressBar = () => {
    const steps: Step[] = ['age', 'glasses', 'wearing', 'purpose', 'confirm'];
    const currentIndex = steps.indexOf(step);
    const skipWearing = profile.glassesType === 'none';
    const totalSteps = skipWearing ? 4 : 5;
    const adjustedIndex = skipWearing && currentIndex > 2 ? currentIndex - 1 : currentIndex;

    return (
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption1 text-muted-foreground">사전 질문</span>
          <span className="text-caption1 text-primary font-semibold">
            {adjustedIndex + 1} / {totalSteps}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((adjustedIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[80vh] p-5 animate-fade-in">
      {renderProgressBar()}

      {/* Step 1: Age Selection */}
      {step === 'age' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <EyeriCharacter
            mood="thinking"
            size="small"
            message="먼저 몇 가지 질문을 드릴게요!"
          />

          <div className="mt-4 mb-6">
            <h2 className="text-h3 font-bold text-foreground mb-2">
              연령대를 선택해주세요
            </h2>
            <p className="text-caption1 text-muted-foreground">
              나이에 따라 조절력이 다르기 때문에 결과 해석에 참고됩니다
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {AGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleAgeSelect(value)}
                className="flex-1 min-w-[60px] card-interactive !p-4 text-center"
              >
                <span className="text-body1 font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="text-muted-foreground text-caption1 mt-auto"
            >
              건너뛰기
            </button>
          )}
        </div>
      )}

      {/* Step 2: Glasses Type */}
      {step === 'glasses' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-6">
            <h2 className="text-h3 font-bold text-foreground mb-2">
              평소 안경이나 렌즈를 착용하시나요?
            </h2>
            <p className="text-caption1 text-muted-foreground">
              교정 상태에 따라 검사 해석이 달라집니다
            </p>
          </div>

          <div className="space-y-3">
            {GLASSES_OPTIONS.map(({ value, label, icon, description }) => (
              <button
                key={value}
                onClick={() => handleGlassesSelect(value)}
                className="w-full card-interactive flex items-center gap-4 text-left"
              >
                <div className="icon-container-md icon-gradient-blue flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="text-body1 font-semibold text-foreground">{label}</p>
                  <p className="text-caption2 text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep('age')}
            className="text-muted-foreground text-caption1 mt-4"
          >
            ← 이전
          </button>
        </div>
      )}

      {/* Step 3: Currently Wearing */}
      {step === 'wearing' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-6">
            <h2 className="text-h3 font-bold text-foreground mb-2">
              지금 안경/렌즈를 착용 중인가요?
            </h2>
            <p className="text-caption1 text-muted-foreground">
              현재 착용 상태로 검사 결과가 해석됩니다
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleWearingSelect(true)}
              className="card-interactive !p-6 text-center"
            >
              <Glasses className="w-10 h-10 text-primary mx-auto mb-2" />
              <span className="text-body1 font-semibold">예</span>
              <p className="text-caption2 text-muted-foreground mt-1">착용 중</p>
            </button>
            <button
              onClick={() => handleWearingSelect(false)}
              className="card-interactive !p-6 text-center"
            >
              <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <span className="text-body1 font-semibold">아니오</span>
              <p className="text-caption2 text-muted-foreground mt-1">미착용</p>
            </button>
          </div>

          <button
            onClick={() => setStep('glasses')}
            className="text-muted-foreground text-caption1 mt-4"
          >
            ← 이전
          </button>
        </div>
      )}

      {/* Step 4: Test Purpose */}
      {step === 'purpose' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <div className="mb-6">
            <h2 className="text-h3 font-bold text-foreground mb-2">
              검사 목적을 선택해주세요
            </h2>
            <p className="text-caption1 text-muted-foreground">
              무엇을 확인하고 싶으신가요?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handlePurposeSelect('uncorrected')}
              className="w-full card-interactive flex items-center gap-4 text-left"
            >
              <div className="icon-container-md bg-orange-100 flex-shrink-0">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-body1 font-semibold text-foreground">맨눈 시력 확인</p>
                <p className="text-caption2 text-muted-foreground">
                  안경 없이 내 눈 그대로 확인하고 싶어요
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => handlePurposeSelect('corrected')}
              className="w-full card-interactive flex items-center gap-4 text-left"
            >
              <div className="icon-container-md bg-blue-100 flex-shrink-0">
                <Glasses className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-body1 font-semibold text-foreground">교정 시력 확인</p>
                <p className="text-caption2 text-muted-foreground">
                  안경/렌즈 착용 상태에서 시력이 궁금해요
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <button
            onClick={() => setStep(profile.glassesType === 'none' ? 'glasses' : 'wearing')}
            className="text-muted-foreground text-caption1 mt-4"
          >
            ← 이전
          </button>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 'confirm' && (
        <div className="flex-1 flex flex-col animate-slide-up">
          <EyeriCharacter
            mood="happy"
            size="small"
            message="준비가 완료되었어요!"
          />

          <div className="mt-4 mb-4">
            <h2 className="text-h3 font-bold text-foreground mb-2">
              입력 내용 확인
            </h2>
          </div>

          {/* Summary Card */}
          <div className="card-glass mb-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-caption1 text-muted-foreground">연령대</span>
                <span className="text-body2 font-semibold">
                  {AGE_OPTIONS.find(o => o.value === profile.ageGroup)?.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-caption1 text-muted-foreground">안경 타입</span>
                <span className="text-body2 font-semibold">
                  {GLASSES_OPTIONS.find(o => o.value === profile.glassesType)?.label}
                </span>
              </div>
              {profile.glassesType !== 'none' && (
                <div className="flex justify-between items-center">
                  <span className="text-caption1 text-muted-foreground">현재 착용</span>
                  <span className="text-body2 font-semibold">
                    {profile.wearingNow ? '예' : '아니오'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-caption1 text-muted-foreground">검사 목적</span>
                <span className="text-body2 font-semibold">
                  {profile.testPurpose === 'uncorrected' ? '맨눈 시력' : '교정 시력'}
                </span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {getWarnings().length > 0 && (
            <div className="card-toss bg-health-amber-light border border-[hsl(var(--health-amber)/0.2)] mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-health-amber flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-body2 font-semibold text-[hsl(var(--health-amber))] mb-1">
                    참고사항
                  </p>
                  <ul className="text-caption1 text-[hsl(var(--health-amber-dark))] space-y-1">
                    {getWarnings().map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Test Info */}
          <div className="card-toss bg-health-blue-light border border-[hsl(var(--health-blue)/0.2)] mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-health-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body2 font-semibold text-health-blue mb-1">
                  검사 안내
                </p>
                <p className="text-caption1 text-[hsl(var(--health-blue-dark))]">
                  40cm 거리에서 <strong>근거리 시력</strong>을 측정합니다.
                  원거리 시력과 다를 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <button
              onClick={handleConfirm}
              className="btn-toss-primary w-full btn-touch"
            >
              검사 시작하기
            </button>
            <button
              onClick={() => setStep('purpose')}
              className="text-muted-foreground text-caption1 w-full"
            >
              ← 이전
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
