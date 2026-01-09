/**
 * Onboarding Slide Component
 * 
 * Individual slide for the onboarding carousel with video animation support.
 * Follows Apps in Toss design guidelines:
 * - Light mode only
 * - 44px+ touch targets
 * - Clean, minimal aesthetic
 */

import { useRef, useEffect } from 'react';

interface OnboardingSlideProps {
  videoUrl: string;
  title: string;
  description: string;
  isActive: boolean;
}

export function OnboardingSlide({ 
  videoUrl, 
  title, 
  description, 
  isActive 
}: OnboardingSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked, that's okay
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center w-full px-6 pt-4 pb-8">
      {/* Video Container with Premium Card */}
      <div 
        className={`
          relative w-full max-w-[280px] aspect-square rounded-[32px] overflow-hidden
          bg-gradient-to-br from-white to-[hsl(var(--neutral-50))]
          transition-all duration-500 ease-smooth
          ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'}
        `}
        style={{
          boxShadow: isActive 
            ? '0 20px 50px -10px rgba(49, 130, 246, 0.25), 0 8px 24px -8px rgba(0, 0, 0, 0.1)'
            : 'var(--shadow-md)',
        }}
      >
        {/* Decorative gradient ring */}
        <div 
          className="absolute inset-0 rounded-[32px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(210 100% 52% / 0.1) 0%, hsl(152 76% 44% / 0.1) 100%)',
            padding: '2px',
          }}
        />
        
        {/* Inner container for video */}
        <div className="absolute inset-[2px] rounded-[30px] overflow-hidden bg-white">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay={isActive}
            loop
            muted
            playsInline
            preload="auto"
          />
        </div>

        {/* Subtle shine overlay */}
        <div 
          className="absolute inset-0 rounded-[32px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Text Content */}
      <div 
        className={`
          mt-10 text-center transition-all duration-500 ease-smooth
          ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}
      >
        <h2 className="text-title1 text-foreground mb-3">
          {title}
        </h2>
        <p className="text-body2 text-[hsl(var(--neutral-500))] leading-relaxed max-w-[280px] mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}
