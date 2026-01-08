import { HomeScreen } from "@/features/home/HomeScreen";
import { Toast } from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
import { useEffect } from "react";

const Index = () => {
  const { toast, showToast, hideToast } = useToast();
  const { appState, isActive } = useAppLifecycle();

  // 앱 상태 변화 로깅 (개발용)
  useEffect(() => {
    console.log("[AppLifecycle] 상태:", appState, "| 활성화:", isActive);
  }, [appState, isActive]);

  return (
    <>
      <HomeScreen onShowToast={showToast} />
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
