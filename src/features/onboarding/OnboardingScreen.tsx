/**
 * Onboarding Screen Component (Simplified 2-Page Version)
 * 
 * Premium onboarding experience for EyeMaster eye health app.
 * Features:
 * - 2 swipeable slides with video animations
 * - New logo prominently displayed
 * - Clean, minimal design following Apps in Toss guidelines
 * - 44px+ touch targets for accessibility
 * - Stores onboarding completion in localStorage
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Scan, Timer, Activity } from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';

// Brand assets
const LOGO_URL = 'https://hoxpxkwgwjupgysobpal.supabase.co/storage/v1/object/public/app-icons/eyemaster_logo.png';

// Video URLs
const VIDEOS = {
  intro: 'https://pub-15b5f8d2b9ba41528bf9e058b210eb5d.r2.dev/u4464796355_cute_mint_green_round_mascot_with_big_round_glass_b883f409-96cb-4fc8-aefb-0443531e7033_1.mp4',
  features: 'https://pub-15b5f8d2b9ba41528bf9e058b210eb5d.r2.dev/u4464796355_cute_mint_green_round_mascot_with_big_round_glass_bf0e1f3b-7633-4a99-8f49-80b534622582_0.mp4',
};

const ONBOARDING_KEY = 'eyemaster_onboarding_completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

/**
 * Animated Fallback Component - Beautiful fallback when video unavailable
 * 
 * Shows animated gradient background with floating icons
 * This provides a premium feel even without video
 */
function AnimatedFallback({ 
  icon,
  variant = 'primary'
}: { 
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: variant === 'primary' 
            ? 'linear-gradient(135deg, hsl(210 100% 96%) 0%, hsl(210 100% 92%) 50%, hsl(152 76% 94%) 100%)'
            : 'linear-gradient(135deg, hsl(152 76% 96%) 0%, hsl(210 100% 94%) 50%, hsl(280 80% 96%) 100%)',
        }}
      />
      
      {/* Floating decorative circles */}
      <div 
        className="absolute w-32 h-32 rounded-full opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, hsl(210 100% 52% / 0.3) 0%, transparent 70%)',
          top: '10%',
          right: '10%',
          animationDuration: '3s',
        }}
      />
      <div 
        className="absolute w-24 h-24 rounded-full opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, hsl(152 76% 44% / 0.3) 0%, transparent 70%)',
          bottom: '20%',
          left: '15%',
          animationDuration: '4s',
          animationDelay: '1s',
        }}
      />
      
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-24 h-24 rounded-3xl flex items-center justify-center animate-pulse"
          style={{
            background: 'linear-gradient(135deg, hsl(210 100% 52%) 0%, hsl(152 76% 44%) 100%)',
            boxShadow: '0 12px 40px -8px rgba(49, 130, 246, 0.4)',
            animationDuration: '2s',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Video Player Component - Graceful degradation approach
 * 
 * Attempts to load video, shows beautiful animated fallback if unavailable
 * Videos require CORS headers from the server to play properly
 */
function VideoPlayer({ 
  src, 
  isActive,
  className = '',
  fallbackIcon
}: { 
  src: string; 
  isActive: boolean;
  className?: string;
  fallbackIcon?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const loadAttemptedRef = useRef(false);

  // Start loading when active
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive || loadAttemptedRef.current) return;
    
    loadAttemptedRef.current = true;
    setStatus('loading');
    video.src = src;
    video.load();
  }, [isActive, src]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setStatus('ready');
      if (isActive) {
        video.play().catch(() => setStatus('ready'));
      }
    };

    const handleError = () => {
      // Silently fall back to animated UI - no console spam
      setStatus('error');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [isActive]);

  // Control playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== 'ready') return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, status]);

  // Timeout - if no success in 5s, show fallback
  useEffect(() => {
    if (status !== 'loading') return;

    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [status]);

  const showVideo = status === 'ready';

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Always render animated fallback as base layer */}
      <AnimatedFallback 
        icon={fallbackIcon || <Eye className="w-12 h-12 text-white" />}
        variant={src.includes('em1') ? 'primary' : 'secondary'}
      />

      {/* Video overlay - fades in when ready */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
        loop
        muted
        playsInline
        preload="none"
      />
    </div>
  );
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { haptic } = useAppsInToss();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const isLastSlide = currentSlide === 1;

  // Touch swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentSlide === 0) {
      handleNext();
    } else if (isRightSwipe && currentSlide > 0) {
      handlePrev();
    }
  };

  const handleNext = useCallback(async () => {
    await haptic('tap');
    if (currentSlide === 0) {
      setCurrentSlide(1);
    }
  }, [currentSlide, haptic]);

  const handlePrev = useCallback(async () => {
    await haptic('tap');
    if (currentSlide > 0) {
      setCurrentSlide(0);
    }
  }, [currentSlide, haptic]);

  const handleSkip = useCallback(async () => {
    await haptic('tap');
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  }, [haptic, onComplete]);

  const handleGetStarted = useCallback(async () => {
    await haptic('success');
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  }, [haptic, onComplete]);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      {/* Header with Logo and Skip */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={LOGO_URL} 
            alt="EyeMaster" 
            className="w-10 h-10 rounded-xl object-cover"
            style={{
              boxShadow: '0 4px 12px rgba(49, 130, 246, 0.2)',
            }}
          />
          <span className="text-lg font-bold text-[hsl(var(--neutral-900))]">EyeMaster</span>
        </div>
        
        {/* Skip Button - 44px+ touch target */}
        <button
          onClick={handleSkip}
          className="min-h-[44px] min-w-[44px] px-4 flex items-center justify-center
                     text-sm font-medium text-[hsl(var(--neutral-500))]
                     rounded-xl transition-all duration-200
                     hover:bg-[hsl(var(--neutral-100))]
                     active:scale-95 active:bg-[hsl(var(--neutral-150))]"
        >
          건너뛰기
        </button>
      </header>

      {/* Decorative Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[300px] h-[300px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, hsl(210 100% 52% / 0.2) 0%, transparent 70%)',
            top: '5%',
            right: '-10%',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute w-[250px] h-[250px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, hsl(152 76% 44% / 0.2) 0%, transparent 70%)',
            bottom: '15%',
            left: '-10%',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Main Content - Slides */}
      <div 
        className="flex-1 flex flex-col relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide 1: App Introduction with Video */}
        <div
          className={`
            absolute inset-0 transition-all duration-500 ease-out flex flex-col items-center justify-center px-6
            ${currentSlide === 0 ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-full z-0'}
          `}
        >
          {/* Video Container */}
          <div 
            className="w-full max-w-[300px] aspect-[4/3] rounded-3xl overflow-hidden mb-8"
            style={{
              boxShadow: '0 20px 50px -10px rgba(49, 130, 246, 0.25), 0 8px 24px -8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <VideoPlayer 
              src={VIDEOS.intro} 
              isActive={currentSlide === 0}
              fallbackIcon={<Eye className="w-10 h-10 text-white" />}
            />
          </div>

          {/* Text Content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[hsl(var(--neutral-900))] mb-3">
              AI 눈 건강 케어
            </h1>
            <p className="text-base text-[hsl(var(--neutral-500))] leading-relaxed max-w-[280px] mx-auto">
              첨단 AI 기술로 당신의 소중한 눈 건강을<br />
              간편하게 관리하세요
            </p>
          </div>
        </div>

        {/* Slide 2: Features Overview */}
        <div
          className={`
            absolute inset-0 transition-all duration-500 ease-out flex flex-col items-center px-6 pt-4
            ${currentSlide === 1 ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-full z-0'}
          `}
        >
          {/* Video Container */}
          <div 
            className="w-full max-w-[280px] aspect-[4/3] rounded-3xl overflow-hidden mb-6"
            style={{
              boxShadow: '0 16px 40px -8px rgba(49, 130, 246, 0.2), 0 6px 16px -6px rgba(0, 0, 0, 0.08)',
            }}
          >
            <VideoPlayer 
              src={VIDEOS.features} 
              isActive={currentSlide === 1}
              fallbackIcon={<Scan className="w-10 h-10 text-white" />}
            />
          </div>

          {/* Features Text */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-[hsl(var(--neutral-900))] mb-2">
              다양한 눈 건강 기능
            </h2>
            <p className="text-sm text-[hsl(var(--neutral-500))]">
              집에서 간편하게 눈 건강을 체크하세요
            </p>
          </div>

          {/* Feature Cards - Compact Grid */}
          <div className="w-full max-w-[320px] grid grid-cols-2 gap-3">
            <FeatureCard 
              icon={<Scan className="w-5 h-5" />}
              title="시력 측정"
              color="blue"
            />
            <FeatureCard 
              icon={<Timer className="w-5 h-5" />}
              title="20-20-20"
              color="green"
            />
            <FeatureCard 
              icon={<Eye className="w-5 h-5" />}
              title="색각 검사"
              color="violet"
            />
            <FeatureCard 
              icon={<Activity className="w-5 h-5" />}
              title="눈 운동"
              color="amber"
            />
          </div>
        </div>

        {/* Navigation Arrows (Desktop/Tablet) */}
        <div className="hidden sm:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-4 pointer-events-none z-20">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`
              w-12 h-12 rounded-full bg-white flex items-center justify-center
              shadow-lg pointer-events-auto transition-all duration-200
              ${currentSlide === 0 ? 'opacity-0' : 'opacity-100 hover:scale-110 active:scale-95'}
            `}
          >
            <ChevronLeft className="w-6 h-6 text-[hsl(var(--neutral-600))]" />
          </button>
          <button
            onClick={handleNext}
            disabled={isLastSlide}
            className={`
              w-12 h-12 rounded-full bg-white flex items-center justify-center
              shadow-lg pointer-events-auto transition-all duration-200
              ${isLastSlide ? 'opacity-0' : 'opacity-100 hover:scale-110 active:scale-95'}
            `}
          >
            <ChevronRight className="w-6 h-6 text-[hsl(var(--neutral-600))]" />
          </button>
        </div>
      </div>

      {/* Bottom Section - Indicators and CTA */}
      <div className="px-6 pb-8 pt-4 safe-area-bottom relative z-20">
        {/* Slide Indicators */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1].map((index) => (
            <button
              key={index}
              onClick={async () => {
                await haptic('tap');
                setCurrentSlide(index);
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Go to slide ${index + 1}`}
            >
              <span
                className={`
                  block rounded-full transition-all duration-300
                  ${index === currentSlide 
                    ? 'w-8 h-2 bg-gradient-to-r from-[hsl(210,100%,52%)] to-[hsl(152,76%,44%)]' 
                    : 'w-2 h-2 bg-[hsl(var(--neutral-300))]'
                  }
                `}
              />
            </button>
          ))}
        </div>

        {/* Primary CTA Button - 44px+ height */}
        <button
          onClick={isLastSlide ? handleGetStarted : handleNext}
          className="w-full min-h-[52px] rounded-2xl text-base font-semibold text-white
                     transition-all duration-200 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, hsl(210 100% 52%) 0%, hsl(210 100% 42%) 100%)',
            boxShadow: '0 8px 24px -4px rgba(49, 130, 246, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.1)',
          }}
        >
          {isLastSlide ? '시작하기' : '다음'}
        </button>

        {/* Secondary action hint */}
        {!isLastSlide && (
          <p className="text-center mt-4 text-xs text-[hsl(var(--neutral-400))]">
            좌우로 스와이프하여 넘길 수 있어요
          </p>
        )}
      </div>
    </div>
  );
}

// Compact Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  color: 'blue' | 'green' | 'violet' | 'amber';
}) {
  const colorStyles = {
    blue: {
      bg: 'bg-[hsl(210,100%,96%)]',
      iconBg: 'bg-gradient-to-br from-[hsl(210,100%,52%)] to-[hsl(210,100%,42%)]',
      text: 'text-[hsl(210,100%,40%)]',
    },
    green: {
      bg: 'bg-[hsl(152,76%,96%)]',
      iconBg: 'bg-gradient-to-br from-[hsl(152,76%,44%)] to-[hsl(152,76%,34%)]',
      text: 'text-[hsl(152,76%,30%)]',
    },
    violet: {
      bg: 'bg-[hsl(280,80%,96%)]',
      iconBg: 'bg-gradient-to-br from-[hsl(280,80%,55%)] to-[hsl(280,80%,45%)]',
      text: 'text-[hsl(280,80%,40%)]',
    },
    amber: {
      bg: 'bg-[hsl(38,100%,96%)]',
      iconBg: 'bg-gradient-to-br from-[hsl(38,100%,50%)] to-[hsl(38,100%,40%)]',
      text: 'text-[hsl(38,100%,30%)]',
    },
  };

  const styles = colorStyles[color];

  return (
    <div className={`${styles.bg} rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`${styles.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <span className={`${styles.text} text-sm font-semibold`}>{title}</span>
    </div>
  );
}

// Export utility to check onboarding status
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

// Export utility to reset onboarding (for testing)
export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}
