import { useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export interface UseToastReturn {
  toast: ToastState;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export function useToast(defaultDuration = 3000): UseToastReturn {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = defaultDuration) => {
      // 기존 타이머 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        visible: true,
        message,
        type,
      });

      // 자동 숨김 타이머
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [defaultDuration, hideToast]
  );

  return {
    toast,
    showToast,
    hideToast,
  };
}
