/**
 * PreTestQuestionnaire - Interactive Demo Page
 *
 * This demo page allows you to test the questionnaire component
 * and see the collected profile data.
 *
 * To use: Import this component and render it in a route or test page
 */

import { useState } from 'react';
import { PreTestQuestionnaire, UserProfile } from './PreTestQuestionnaire';
import { CheckCircle2, RefreshCw, User, Glasses, Eye, Target } from 'lucide-react';

export function PreTestQuestionnaireDemo() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [collectedProfile, setCollectedProfile] = useState<UserProfile | null>(null);

  const handleComplete = (profile: UserProfile) => {
    console.log('✅ Profile collected:', profile);
    setCollectedProfile(profile);
    setShowQuestionnaire(false);
  };

  const handleSkip = () => {
    console.log('⏭️ User skipped questionnaire');
    setShowQuestionnaire(false);
  };

  const handleReset = () => {
    setCollectedProfile(null);
    setShowQuestionnaire(true);
  };

  if (showQuestionnaire) {
    return (
      <PreTestQuestionnaire
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    );
  }

  // Results screen
  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="icon-container-md bg-health-green-light rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-health-green" />
          </div>
          <h1 className="text-title2 font-bold text-foreground">
            프로필 수집 완료!
          </h1>
        </div>
        <p className="text-body2 text-neutral-500">
          수집된 사용자 프로필을 확인하세요
        </p>
      </div>

      {/* Profile Display */}
      <div className="flex-1 px-5 pb-6 overflow-auto hide-scrollbar">
        {collectedProfile ? (
          <div className="space-y-4 animate-fade-in">
            {/* Age Group */}
            <div className="card-glass bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="icon-container-sm bg-health-blue-light rounded-xl">
                  <User className="w-5 h-5 text-health-blue" />
                </div>
                <h3 className="text-body1 font-semibold text-foreground">
                  연령대
                </h3>
              </div>
              <div className="text-title3 font-bold text-health-blue">
                {getAgeGroupLabel(collectedProfile.ageGroup)}
              </div>
            </div>

            {/* Glasses Type */}
            <div className="card-glass bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="icon-container-sm bg-health-violet-light rounded-xl">
                  <Glasses className="w-5 h-5 text-health-violet" />
                </div>
                <h3 className="text-body1 font-semibold text-foreground">
                  안경 착용
                </h3>
              </div>
              <div className="text-title3 font-bold text-health-violet mb-2">
                {getGlassesTypeLabel(collectedProfile.glassesType)}
              </div>
              {collectedProfile.glassesType !== 'none' && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-200">
                  <Eye className="w-4 h-4 text-neutral-500" />
                  <span className="text-body3 text-neutral-600">
                    현재 착용 상태:{' '}
                    <span className="font-semibold text-foreground">
                      {collectedProfile.wearingNow ? '착용 중' : '미착용'}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Test Purpose */}
            <div className="card-glass bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="icon-container-sm bg-health-green-light rounded-xl">
                  <Target className="w-5 h-5 text-health-green" />
                </div>
                <h3 className="text-body1 font-semibold text-foreground">
                  검사 목적
                </h3>
              </div>
              <div className="text-title3 font-bold text-health-green">
                {getTestPurposeLabel(collectedProfile.testPurpose)}
              </div>
            </div>

            {/* JSON Data */}
            <div className="card-glass bg-neutral-50 p-5">
              <h3 className="text-body2 font-semibold text-foreground mb-3">
                Raw Data (JSON)
              </h3>
              <pre className="text-caption1 text-neutral-700 overflow-x-auto bg-white rounded-xl p-3 border border-neutral-200">
{JSON.stringify(collectedProfile, null, 2)}
              </pre>
            </div>

            {/* Adaptive Test Config Example */}
            <div className="card-glass bg-health-blue-subtle p-5">
              <h3 className="text-body2 font-semibold text-foreground mb-3">
                추천 검사 설정
              </h3>
              <div className="space-y-2 text-body3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">시청 거리</span>
                  <span className="font-semibold text-foreground">
                    {getRecommendedDistance(collectedProfile)}cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">시작 크기</span>
                  <span className="font-semibold text-foreground">
                    {getRecommendedStartSize(collectedProfile)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">검사 유형</span>
                  <span className="font-semibold text-foreground">
                    {collectedProfile.testPurpose === 'corrected' ? '교정 시력' : '맨눈 시력'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-glass bg-white p-6 text-center">
            <p className="text-body2 text-neutral-500">
              프로필이 수집되지 않았습니다 (사용자가 건너뛰기를 선택함)
            </p>
          </div>
        )}
      </div>

      {/* Reset Button */}
      <div className="px-5 pb-6">
        <button
          onClick={handleReset}
          className="btn-toss-primary w-full flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>다시 시작하기</span>
        </button>
      </div>
    </div>
  );
}

// Helper functions for displaying labels
function getAgeGroupLabel(ageGroup: UserProfile['ageGroup']): string {
  const labels = {
    '20s': '20대',
    '30s': '30대',
    '40s': '40대',
    '50s': '50대',
    '60plus': '60대 이상',
  };
  return labels[ageGroup];
}

function getGlassesTypeLabel(glassesType: UserProfile['glassesType']): string {
  const labels = {
    myopia: '근시용 안경',
    hyperopia: '원시/노안용 안경',
    multifocal: '다초점 안경',
    none: '안경 미착용',
  };
  return labels[glassesType];
}

function getTestPurposeLabel(testPurpose: UserProfile['testPurpose']): string {
  const labels = {
    uncorrected: '맨눈 시력 검사',
    corrected: '교정 시력 검사',
  };
  return labels[testPurpose];
}

function getRecommendedDistance(profile: UserProfile): number {
  // Recommend closer distance for presbyopia (50+)
  if (profile.ageGroup === '50s' || profile.ageGroup === '60plus') {
    return 40;
  }
  return 50;
}

function getRecommendedStartSize(profile: UserProfile): string {
  // Start with larger optotypes for uncorrected vision or no glasses
  if (profile.testPurpose === 'uncorrected' || profile.glassesType === 'none') {
    return '큰 크기 (LogMAR 0.3)';
  }
  return '중간 크기 (LogMAR 0.1)';
}
