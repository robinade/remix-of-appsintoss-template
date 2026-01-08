/**
 * Eye Master AI - 메인 앱 컴포넌트
 * 올인원 눈 건강 관리 미니앱
 */

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { ScreenType } from './types';
import { useEyeHealth } from './hooks/useEyeHealth';
import { HealthDashboard } from './components/HealthDashboard';
import { DistanceCalibration } from './components/DistanceCalibration';
import { VisionTest } from './components/VisionTest';
import { ColorBlindTest } from './components/ColorBlindTest';
import { AstigmatismTest } from './components/AstigmatismTest';
import { Timer2020 } from './components/Timer2020';
import { EyeExercise } from './components/EyeExercise';

interface EyeMasterAppProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function EyeMasterApp({ onShowToast }: EyeMasterAppProps) {
  const { haptic } = useAppsInToss();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const { 
    stats, 
    isLoaded,
    saveVisionResult,
    recordTimerSession,
    recordExerciseSession,
  } = useEyeHealth();

  const handleNavigate = async (screen: ScreenType) => {
    await haptic('tap');
    setCurrentScreen(screen);
  };

  const handleBack = async () => {
    await haptic('tap');
    setCurrentScreen('home');
  };

  const handleVisionTestComplete = async (score: number) => {
    const today = new Date().toISOString().split('T')[0];
    await saveVisionResult({
      date: today,
      leftEye: score,
      rightEye: score,
      bothEyes: score,
    });
    onShowToast?.('시력 테스트 결과가 저장되었습니다', 'success');
    setCurrentScreen('home');
  };

  const handleColorTestComplete = async (score: number, total: number) => {
    onShowToast?.(`색약 테스트 완료: ${score}/${total}`, 'success');
    setCurrentScreen('home');
  };

  const handleAstigmatismComplete = async (hasAstigmatism: boolean) => {
    onShowToast?.(
      hasAstigmatism ? '난시 의심 증상이 있습니다' : '난시 의심 없음',
      hasAstigmatism ? 'info' : 'success'
    );
    setCurrentScreen('home');
  };

  const handleTimerComplete = async () => {
    await recordTimerSession();
    onShowToast?.('20-20-20 세션 완료!', 'success');
  };

  const handleExerciseComplete = async () => {
    await recordExerciseSession();
    onShowToast?.('눈 운동 완료!', 'success');
  };

  // 로딩 중
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">👁️</span>
          </div>
          <p className="text-body2 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 뒤로가기 헤더
  const BackHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 p-4 border-b border-border bg-background sticky top-0 z-10">
      <button
        onClick={handleBack}
        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      <h1 className="text-body1 font-bold text-foreground">{title}</h1>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 홈 화면 */}
      {currentScreen === 'home' && (
        <HealthDashboard stats={stats} onNavigate={handleNavigate} />
      )}

      {/* AI 거리 측정 */}
      {currentScreen === 'calibration' && (
        <>
          <BackHeader title="AI 거리 측정" />
          <DistanceCalibration 
            onComplete={() => setCurrentScreen('vision-test')}
            onError={() => onShowToast?.('카메라 접근에 실패했습니다', 'error')}
          />
        </>
      )}

      {/* 시력 테스트 */}
      {currentScreen === 'vision-test' && (
        <>
          <BackHeader title="시력 측정" />
          <VisionTest 
            onComplete={handleVisionTestComplete}
            onBack={handleBack}
          />
        </>
      )}

      {/* 색약 테스트 */}
      {currentScreen === 'color-test' && (
        <>
          <BackHeader title="색약 테스트" />
          <ColorBlindTest 
            onComplete={handleColorTestComplete}
            onBack={handleBack}
          />
        </>
      )}

      {/* 난시 테스트 */}
      {currentScreen === 'astigmatism-test' && (
        <>
          <BackHeader title="난시 테스트" />
          <AstigmatismTest 
            onComplete={handleAstigmatismComplete}
            onBack={handleBack}
          />
        </>
      )}

      {/* 20-20-20 타이머 */}
      {currentScreen === 'timer' && (
        <>
          <BackHeader title="20-20-20 타이머" />
          <Timer2020 
            onSessionComplete={handleTimerComplete}
            onBack={handleBack}
          />
        </>
      )}

      {/* 눈 운동 */}
      {currentScreen === 'exercise' && (
        <>
          <BackHeader title="눈 운동 가이드" />
          <EyeExercise 
            onComplete={handleExerciseComplete}
            onBack={handleBack}
          />
        </>
      )}
    </div>
  );
}
