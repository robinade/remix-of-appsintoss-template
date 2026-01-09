/**
 * 실시간 거리 모니터링 컴포넌트
 * 테스트 중 화면 모서리에 표시되는 작은 카메라 피드백
 * 
 * 개선사항:
 * - 얼굴 바운딩 박스 기반 거리 측정 (한쪽 눈 가려도 작동)
 * - IPD + 얼굴 박스 하이브리드 방식
 * - 카메라 해상도 향상 (640x480)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, AlertTriangle, Eye } from 'lucide-react';

export type DistanceStatus = 'loading' | 'no_face' | 'too_far' | 'too_close' | 'perfect';

interface DistanceMonitorProps {
  onDistanceChange: (status: DistanceStatus, isValid: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  inline?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 거리 측정 상수 (40cm 기준)
// ═══════════════════════════════════════════════════════════════════════════
// 
// 측정 방법: 얼굴 바운딩 박스 높이 (픽셀)
// - 평균 성인 얼굴 높이: 약 23cm
// - 40cm 거리에서 640x480 카메라 기준 예상 얼굴 높이: 약 180-280px
// 
// 참고: 실제 값은 카메라 FOV, 기기마다 다를 수 있으므로 넓은 범위 사용
// ═══════════════════════════════════════════════════════════════════════════
const FACE_HEIGHT_MIN = 140;  // 이보다 작으면 너무 멂 (40cm 이상)
const FACE_HEIGHT_MAX = 320;  // 이보다 크면 너무 가까움 (40cm 이하)

// IPD 기반 측정 (보조용 - 두 눈 다 보일 때)
const IPD_MIN = 55;   // 너무 멀면
const IPD_MAX = 90;   // 너무 가까우면

export function DistanceMonitor({ 
  onDistanceChange,
  size = 'small',
  position = 'top-right',
  inline = false,
  className = '',
}: DistanceMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<DistanceStatus>('loading');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const modelRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // 얼굴 감지 및 거리 측정 (개선된 버전)
  const detectFace = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current) {
      requestRef.current = requestAnimationFrame(detectFace);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 맞추기
    if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    try {
      const predictions = await modelRef.current.estimateFaces(video, false);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        const face = predictions[0];
        
        // ═══════════════════════════════════════════════════════════════
        // 방법 1: 얼굴 바운딩 박스 기반 (한쪽 눈 가려도 작동!)
        // ═══════════════════════════════════════════════════════════════
        const topLeft = face.topLeft as [number, number];
        const bottomRight = face.bottomRight as [number, number];
        const faceWidth = bottomRight[0] - topLeft[0];
        const faceHeight = bottomRight[1] - topLeft[1];
        
        // ═══════════════════════════════════════════════════════════════
        // 방법 2: IPD (눈 사이 거리) - 두 눈 다 보일 때만 사용
        // ═══════════════════════════════════════════════════════════════
        const landmarks = face.landmarks;
        let eyeDistancePx = 0;
        let hasValidEyes = false;
        
        if (landmarks && landmarks.length >= 2) {
          const rightEye = landmarks[0];
          const leftEye = landmarks[1];
          
          // 눈 좌표가 얼굴 바운딩 박스 안에 있는지 확인
          const rightEyeValid = rightEye[0] > topLeft[0] && rightEye[0] < bottomRight[0];
          const leftEyeValid = leftEye[0] > topLeft[0] && leftEye[0] < bottomRight[0];
          
          if (rightEyeValid && leftEyeValid) {
            const dx = rightEye[0] - leftEye[0];
            const dy = rightEye[1] - leftEye[1];
            eyeDistancePx = Math.sqrt(dx * dx + dy * dy);
            hasValidEyes = eyeDistancePx > 20; // 최소 20px 이상이어야 유효
          }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // 거리 판별 (하이브리드: 얼굴 높이 우선, IPD 보조)
        // ═══════════════════════════════════════════════════════════════
        let newStatus: DistanceStatus;
        let isValid = false;
        let lineColor = '#ef4444';
        
        // 주요 측정: 얼굴 높이 기반
        const faceHeightValid = faceHeight >= FACE_HEIGHT_MIN && faceHeight <= FACE_HEIGHT_MAX;
        
        // 보조 측정: IPD 기반 (두 눈 다 보일 때만)
        const ipdValid = hasValidEyes ? (eyeDistancePx >= IPD_MIN && eyeDistancePx <= IPD_MAX) : true;
        
        if (faceHeight < FACE_HEIGHT_MIN) {
          newStatus = 'too_far';
          lineColor = '#eab308';
        } else if (faceHeight > FACE_HEIGHT_MAX) {
          newStatus = 'too_close';
          lineColor = '#ef4444';
        } else if (faceHeightValid && ipdValid) {
          newStatus = 'perfect';
          lineColor = '#22c55e';
          isValid = true;
        } else {
          // 얼굴 높이는 OK인데 IPD가 이상한 경우 → 얼굴 높이 우선
          newStatus = 'perfect';
          lineColor = '#22c55e';
          isValid = true;
        }

        setStatus(newStatus);
        onDistanceChange(newStatus, isValid);
        
        // 디버그 정보
        setDebugInfo(`H:${Math.round(faceHeight)} ${hasValidEyes ? `E:${Math.round(eyeDistancePx)}` : '👁️?'}`);

        // ═══════════════════════════════════════════════════════════════
        // 시각화
        // ═══════════════════════════════════════════════════════════════
        
        // 얼굴 바운딩 박스 그리기
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(topLeft[0], topLeft[1], faceWidth, faceHeight);
        
        // 눈 위치 표시 (감지된 경우만)
        if (hasValidEyes && landmarks) {
          const rightEye = landmarks[0];
          const leftEye = landmarks[1];
          
          // 눈 사이 선
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rightEye[0], rightEye[1]);
          ctx.lineTo(leftEye[0], leftEye[1]);
          ctx.stroke();

          // 눈 위치 점
          ctx.fillStyle = lineColor;
          [rightEye, leftEye].forEach(eye => {
            ctx.beginPath();
            ctx.arc(eye[0], eye[1], 4, 0, 2 * Math.PI);
            ctx.fill();
          });
        } else {
          // 한쪽 눈만 보이는 경우 - 얼굴 중앙에 표시
          ctx.fillStyle = lineColor;
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👁️', topLeft[0] + faceWidth / 2, topLeft[1] + faceHeight / 2);
        }
      } else {
        setStatus('no_face');
        onDistanceChange('no_face', false);
        setDebugInfo('얼굴 없음');
      }
    } catch (err) {
      console.error('Face detection error:', err);
    }

    requestRef.current = requestAnimationFrame(detectFace);
  }, [onDistanceChange]);

  // 카메라 시작 (해상도 향상)
  const startVideo = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 },   // 해상도 향상
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          if (isModelLoaded) {
            detectFace();
          }
        };
      }
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      return false;
    }
  }, [isModelLoaded, detectFace]);

  // TensorFlow.js 모델 로드
  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      try {
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        // TensorFlow.js 로드
        if (!(window as any).tf) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0');
        }
        if (!(window as any).blazeface) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7');
        }

        // 모델 로드
        const model = await (window as any).blazeface.load();
        if (!isMounted) return;
        
        modelRef.current = model;
        setIsModelLoaded(true);
        
        // 카메라 시작
        await startVideo();
      } catch (err) {
        console.error('Failed to load AI models:', err);
        setStatus('loading');
      }
    };

    loadResources();

    return () => {
      isMounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startVideo]);

  // 모델 로드 후 감지 시작
  useEffect(() => {
    if (isModelLoaded && videoRef.current?.readyState === 4) {
      detectFace();
    }
  }, [isModelLoaded, detectFace]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 크기 설정
  const sizeClasses = {
    small: 'w-20 h-16',
    medium: 'w-28 h-22',
    large: 'w-full h-full',
  };

  // 위치 설정
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  // 상태별 스타일
  const statusConfig = {
    loading: { bg: 'bg-slate-500', icon: null, text: '로딩' },
    no_face: { bg: 'bg-orange-500', icon: <Eye className="w-3 h-3" />, text: '얼굴?' },
    too_far: { bg: 'bg-yellow-500', icon: <AlertTriangle className="w-3 h-3" />, text: '가까이' },
    too_close: { bg: 'bg-red-500', icon: <AlertTriangle className="w-3 h-3" />, text: '멀리' },
    perfect: { bg: 'bg-green-500', icon: <Check className="w-3 h-3" />, text: '40cm' },
  };

  const config = statusConfig[status];

  return (
    <div 
      className={`
        ${inline ? 'relative' : `fixed ${positionClasses[position]} z-50`}
        ${sizeClasses[size]}
        rounded-xl overflow-hidden
        shadow-lg border-2
        ${status === 'perfect' ? 'border-green-500' : status === 'no_face' || status === 'loading' ? 'border-slate-400' : 'border-red-500'}
        ${className}
      `}
    >
      {/* 비디오 피드 */}
      <div className="relative w-full h-full bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* 상태 표시 배지 */}
        <div 
          className={`
            absolute bottom-0 left-0 right-0
            ${config.bg} text-white
            flex items-center justify-center gap-1
            py-0.5 text-[10px] font-bold
          `}
        >
          {config.icon}
          <span>{config.text}</span>
        </div>
        
        {/* 디버그 정보 (개발용 - 프로덕션에서는 숨김 가능) */}
        {size !== 'small' && debugInfo && (
          <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded">
            {debugInfo}
          </div>
        )}
      </div>
    </div>
  );
}

export default DistanceMonitor;
