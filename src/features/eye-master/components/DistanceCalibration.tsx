/**
 * AI 기반 거리 측정 컴포넌트
 * TensorFlow.js + BlazeFace 사용
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Scan, Loader2, AlertTriangle, Check, Camera, RefreshCw } from 'lucide-react';
import { CalibrationStatus } from '../types';

interface DistanceCalibrationProps {
  onComplete: () => void;
  onError?: () => void;
}

type PermissionState = 'prompt' | 'granted' | 'denied' | 'checking';

export function DistanceCalibration({ onComplete, onError }: DistanceCalibrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<CalibrationStatus>('loading_model');
  const [eyeDistance, setEyeDistance] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const modelRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  // 카메라 권한 상태 확인
  const checkCameraPermission = useCallback(async (): Promise<PermissionState> => {
    try {
      // Permission API 지원 확인
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return result.state as PermissionState;
      }
      // Permission API 미지원 시 prompt로 가정
      return 'prompt';
    } catch {
      // 일부 브라우저에서 camera 권한 쿼리 미지원
      return 'prompt';
    }
  }, []);

  // 카메라 스트림 시작
  const startVideo = useCallback(async () => {
    try {
      // 기존 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      setPermissionState('granted');
      setCameraError(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          detectFace();
        };
      }
      return true;
    } catch (err: any) {
      console.error('Camera access error:', err);
      
      // 에러 유형별 메시지 설정
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('카메라가 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.');
      } else if (err.name === 'OverconstrainedError') {
        setErrorMessage('카메라 설정을 지원하지 않습니다.');
      } else if (err.name === 'SecurityError') {
        setErrorMessage('보안 정책으로 인해 카메라에 접근할 수 없습니다. HTTPS 연결이 필요합니다.');
      } else {
        setErrorMessage('카메라에 접근할 수 없습니다. 다시 시도해주세요.');
      }
      
      setCameraError(true);
      return false;
    }
  }, []);

  // 얼굴 감지 함수
  const detectFace = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    try {
      const predictions = await modelRef.current.estimateFaces(video, false);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        const rightEye = landmarks[0];
        const leftEye = landmarks[1];

        const dx = rightEye[0] - leftEye[0];
        const dy = rightEye[1] - leftEye[1];
        const eyeDistancePx = Math.sqrt(dx * dx + dy * dy);
        setEyeDistance(Math.round(eyeDistancePx));

        // 거리 판별 (40cm 기준)
        const TARGET_MIN = 95;
        const TARGET_MAX = 125;

        let lineColor = '#ef4444';
        if (eyeDistancePx >= TARGET_MIN && eyeDistancePx <= TARGET_MAX) {
          lineColor = '#22c55e';
          setStatus('perfect');
        } else if (eyeDistancePx < TARGET_MIN) {
          lineColor = '#eab308';
          setStatus('too_far');
        } else {
          lineColor = '#ef4444';
          setStatus('too_close');
        }

        // 시각화
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rightEye[0], rightEye[1]);
        ctx.lineTo(leftEye[0], leftEye[1]);
        ctx.stroke();

        ctx.fillStyle = lineColor;
        [rightEye, leftEye].forEach(eye => {
          ctx.beginPath();
          ctx.arc(eye[0], eye[1], 6, 0, 2 * Math.PI);
          ctx.fill();
        });
      } else {
        setStatus('searching');
      }
    } catch (err) {
      console.error('Face detection error', err);
    }

    requestRef.current = requestAnimationFrame(detectFace);
  }, []);

  // TensorFlow.js 모델 로드
  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      try {
        // 먼저 카메라 권한 상태 확인
        const permission = await checkCameraPermission();
        if (!isMounted) return;
        setPermissionState(permission);

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
        setStatus('searching');
        
        // 권한이 이미 granted이거나 prompt 상태면 카메라 시작 시도
        if (permission === 'granted') {
          await startVideo();
        }
      } catch (err) {
        console.error('Failed to load AI models', err);
        if (isMounted) {
          setErrorMessage('AI 모델을 로드하는 데 실패했습니다. 네트워크 연결을 확인해주세요.');
          setCameraError(true);
          onError?.();
        }
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
  }, [checkCameraPermission, startVideo, onError]);

  // 카메라 권한 요청 버튼 핸들러
  const handleRequestPermission = async () => {
    setPermissionState('checking');
    setCameraError(false);
    setErrorMessage('');
    
    const success = await startVideo();
    if (!success) {
      // 에러는 startVideo에서 처리됨
    }
  };

  // 재시도 핸들러
  const handleRetry = async () => {
    setCameraError(false);
    setErrorMessage('');
    setPermissionState('checking');
    setStatus('loading_model');
    
    // 스트림 정리 후 재시도
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    const success = await startVideo();
    if (success) {
      setStatus('searching');
    }
  };

  const handleComplete = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    onComplete();
  };

  const statusConfig = {
    loading_model: { text: 'AI 모델 로딩 중...', color: 'text-muted-foreground' },
    searching: { text: '얼굴을 찾는 중...', color: 'text-muted-foreground' },
    too_far: { text: '더 가까이 오세요', color: 'text-warning' },
    too_close: { text: '조금 더 뒤로', color: 'text-destructive' },
    perfect: { text: '거리 확보됨! (40cm)', color: 'text-success' },
  };

  // 카메라 권한 요청 화면
  if (permissionState === 'prompt' || (permissionState === 'checking' && status !== 'loading_model')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Camera className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-title3 text-foreground mb-2 text-center">카메라 권한이 필요합니다</h2>
        <p className="text-body2 text-muted-foreground text-center mb-8 max-w-xs">
          정확한 거리 측정을 위해 카메라를 사용합니다.
          영상은 기기 내에서만 처리되며 저장되지 않습니다.
        </p>
        <button
          onClick={handleRequestPermission}
          className="w-full max-w-xs bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-body1 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <Camera className="w-5 h-5" />
          카메라 권한 허용하기
        </button>
        <button
          onClick={handleComplete}
          className="mt-4 text-muted-foreground text-body2 underline"
        >
          권한 없이 시작하기
        </button>
      </div>
    );
  }

  // 에러 화면
  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-title3 text-foreground mb-2 text-center">카메라 접근 불가</h2>
        <p className="text-body2 text-muted-foreground text-center mb-6 max-w-xs">
          {errorMessage || '카메라에 접근할 수 없습니다.'}
        </p>
        
        {permissionState === 'denied' && (
          <div className="bg-secondary/50 rounded-xl p-4 mb-6 max-w-xs">
            <p className="text-caption1 text-muted-foreground text-center">
              <strong>권한 허용 방법:</strong><br />
              브라우저 주소창 왼쪽의 🔒 아이콘 클릭 → 카메라 권한 허용 → 페이지 새로고침
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleRetry}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-body1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </button>
          <button
            onClick={handleComplete}
            className="w-full bg-secondary text-foreground py-4 rounded-2xl font-bold text-body1"
          >
            권한 없이 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 헤더 */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          <span className="text-body2 font-semibold">AI 거리 측정</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-secondary text-caption1">
          IPD: {eyeDistance}px
        </div>
      </div>

      {/* 비디오 영역 */}
      <div className="relative flex-1 bg-foreground overflow-hidden rounded-2xl mx-4">
        {status === 'loading_model' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-white text-body2">AI 초기화 중...</p>
          </div>
        )}
        
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

        {/* 상태 오버레이 */}
        {status !== 'loading_model' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl backdrop-blur-md ${
              status === 'perfect' 
                ? 'bg-success/90' 
                : status === 'searching' 
                  ? 'bg-foreground/70'
                  : status === 'too_far'
                    ? 'bg-warning/90'
                    : 'bg-destructive/90'
            }`}>
              {status === 'perfect' ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Eye className="w-5 h-5 text-white" />
              )}
              <span className="text-white font-semibold">
                {statusConfig[status].text}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 안내 및 버튼 */}
      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-body2 font-semibold text-foreground">AI 생체 인식 거리 측정</h3>
            <p className="text-caption1 text-muted-foreground">
              눈동자 사이 거리를 분석하여 정확한 40cm를 측정합니다.
              초록불이 켜지면 테스트를 시작하세요.
            </p>
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={status !== 'perfect'}
          className={`w-full py-4 rounded-2xl font-bold text-body1 transition-all flex items-center justify-center gap-2 ${
            status === 'perfect'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
        >
          {status === 'perfect' ? '테스트 시작' : '거리 맞추는 중...'}
        </button>
      </div>
    </div>
  );
}