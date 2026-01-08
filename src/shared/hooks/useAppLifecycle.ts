import { useState, useEffect, useCallback } from "react";

export type AppState = "active" | "background" | "inactive";

export interface UseAppLifecycleReturn {
  appState: AppState;
  isActive: boolean;
  isBackground: boolean;
}

export function useAppLifecycle(): UseAppLifecycleReturn {
  const [appState, setAppState] = useState<AppState>("active");

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setAppState("background");
    } else {
      setAppState("active");
    }
  }, []);

  const handleFocus = useCallback(() => {
    setAppState("active");
  }, []);

  const handleBlur = useCallback(() => {
    setAppState("inactive");
  }, []);

  useEffect(() => {
    // 페이지 가시성 변화 감지
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // 윈도우 포커스 변화 감지
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleVisibilityChange, handleFocus, handleBlur]);

  return {
    appState,
    isActive: appState === "active",
    isBackground: appState === "background",
  };
}
