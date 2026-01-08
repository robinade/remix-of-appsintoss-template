import { EyeMasterApp } from "@/features/eye-master";
import { Toast } from "@/shared/components/Toast";
import { useToast } from "@/shared/hooks/useToast";

const Index = () => {
  const { toast, showToast, hideToast } = useToast();

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
