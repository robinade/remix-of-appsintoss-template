import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ToastType } from "../hooks/useToast";

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onClose: () => void;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styleMap = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-[#3182F6]",
};

export function Toast({ visible, message, type, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!isAnimating && !visible) return null;

  const Icon = iconMap[type];

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg ${styleMap[type]}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 rounded-full p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
