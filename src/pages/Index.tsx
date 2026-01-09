/**
 * Index Page - Entry Point
 * 
 * Shows onboarding on first visit, then the main EyeMaster app.
 */

import { useState, useEffect } from 'react';
import { EyeMasterApp } from "@/features/eye-master";
import { OnboardingScreen, hasCompletedOnboarding } from "@/features/onboarding";
import { Toast } from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";

const Index = () => {
  const { toast, showToast, hideToast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Check onboarding status on mount
  useEffect(() => {
    const completed = hasCompletedOnboarding();
    setShowOnboarding(!completed);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    showToast('EyeMaster에 오신 것을 환영합니다!', 'success');
  };

  // Loading state while checking localStorage
  if (showOnboarding === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <img 
            src="https://hoxpxkwgwjupgysobpal.supabase.co/storage/v1/object/public/app-icons/eyemaster_logo.png"
            alt="EyeMaster"
            className="w-16 h-16 rounded-2xl"
          />
        </div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Main app for returning users
  return (
    <>
      <EyeMasterApp onShowToast={showToast} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};

export default Index;
