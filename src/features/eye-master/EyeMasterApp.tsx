/**
 * Eye Master AI - 메인 앱 컴포넌트
 * 올인원 눈 건강 관리 미니앱
 */

import { useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
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

  // 로딩 중 - Premium Loading Screen
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          {/* Premium Icon Container with Glow */}
          <div className="relative mx-auto mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 w-24 h-24 rounded-3xl bg-gradient-to-br from-[hsl(var(--health-blue))] to-[hsl(var(--health-green))] blur-xl opacity-30 animate-pulse-soft" />
            {/* Main icon */}
            <div className="relative icon-container-xl icon-vivid-blue animate-float mx-auto">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* App Name with gradient */}
          <h1 className="text-title2 font-bold text-foreground mb-1">눈 건강 마스터</h1>
          
          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--health-blue))] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--health-blue))] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--health-blue))] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <p className="text-caption1 text-muted-foreground mt-3">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 뒤로가기 헤더 - Premium Sticky Header
  const BackHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 p-4 border-b border-[hsl(var(--neutral-200)/0.6)] bg-white/80 backdrop-blur-xl sticky top-0 z-10"
         style={{ boxShadow: 'var(--shadow-sm)' }}>
      <button
        onClick={handleBack}
        className="w-11 h-11 rounded-2xl bg-[hsl(var(--neutral-100))] flex items-center justify-center
                   transition-all duration-150 btn-touch
                   hover:bg-[hsl(var(--neutral-150))]
                   active:scale-95 active:bg-[hsl(var(--neutral-200))]"
      >
        <ArrowLeft className="w-5 h-5 text-[hsl(var(--neutral-700))]" />
      </button>
      <h1 className="text-title3 text-foreground">{title}</h1>
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
