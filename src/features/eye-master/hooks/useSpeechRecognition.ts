/**
 * 음성인식 커스텀 훅 - 시력 테스트용
 *
 * Web Speech API를 사용하여 알파벳 글자를 음성으로 인식합니다.
 * WebView에서는 지원되지 않을 수 있으므로 graceful fallback을 제공합니다.
 *
 * 지원 브라우저:
 * - Chrome (Desktop/Android 브라우저)
 * - Safari (14.1+)
 * - Edge Chromium
 *
 * ⚠️ WebView 환경에서는 지원되지 않음 (Apps-in-Toss 포함)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// TypeScript 타입 정의
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Sloan 글자 (시력검사 표준)
const SLOAN_LETTERS = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z'];

// 발음 매핑 (한국어 발음 → 알파벳)
// 사용자가 "씨", "디", "에이치" 등으로 발음했을 때 매칭
const PRONUNCIATION_MAP: Record<string, string> = {
  // 영어 알파벳 그대로
  'c': 'C', 'd': 'D', 'h': 'H', 'k': 'K', 'n': 'N',
  'o': 'O', 'r': 'R', 's': 'S', 'v': 'V', 'z': 'Z',

  // 한국어 발음 변형
  '씨': 'C', '시': 'C',
  '디': 'D',
  '에이치': 'H', '에치': 'H', '에잇치': 'H', '에잌': 'H', '에잇': 'H',
  '케이': 'K', '게이': 'K', '게': 'K', '캐': 'K',
  '엔': 'N', '앤': 'N', '엠': 'N', // 엠과 엔은 비슷하게 들릴 수 있음
  '오': 'O', '오우': 'O',
  '알': 'R', '아르': 'R', '아알': 'R', '아': 'R',
  '에스': 'S', '엣': 'S', '엣스': 'S', '에쓰': 'S',
  '브이': 'V', '비': 'V', '뷔': 'V',
  '지': 'Z', '제드': 'Z', '제트': 'Z', '젯': 'Z', '지이': 'Z',

  // NATO 발음 알파벳 (일부)
  'charlie': 'C', '찰리': 'C',
  'delta': 'D', '델타': 'D',
  'hotel': 'H', '호텔': 'H',
  'kilo': 'K', '킬로': 'K',
  'november': 'N', '노벰버': 'N',
  'oscar': 'O', '오스카': 'O',
  'romeo': 'R', '로미오': 'R',
  'sierra': 'S', '시에라': 'S',
  'victor': 'V', '빅터': 'V', '빅토르': 'V',
  'zulu': 'Z', '줄루': 'Z',
};

// 음성인식 에러 타입
type SpeechError =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'not-supported';

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<SpeechError, string> = {
  'no-speech': '음성이 감지되지 않았습니다',
  'aborted': '음성인식이 중단되었습니다',
  'audio-capture': '마이크를 찾을 수 없습니다',
  'network': '네트워크 오류가 발생했습니다',
  'not-allowed': '마이크 권한이 거부되었습니다',
  'service-not-allowed': '음성인식 서비스를 사용할 수 없습니다',
  'bad-grammar': '음성인식 문법 오류입니다',
  'language-not-supported': '해당 언어를 지원하지 않습니다',
  'not-supported': '이 브라우저에서 음성인식을 지원하지 않습니다',
};

export interface UseSpeechRecognitionOptions {
  /** 인식할 언어 (기본: 한국어) */
  language?: string;
  /** 연속 인식 모드 */
  continuous?: boolean;
  /** 중간 결과 표시 */
  interimResults?: boolean;
  /** 타임아웃 (ms) - 음성 없을 시 자동 중지 */
  timeout?: number;
}

export interface UseSpeechRecognitionResult {
  /** 전체 음성인식 기능 지원 여부 (API + 마이크 모두) */
  isSupported: boolean;
  /** Web Speech API 지원 여부 */
  hasWebSpeechAPI: boolean;
  /** 마이크 접근 가능 여부 */
  hasMicrophoneAccess: boolean;
  /** WebView 환경인지 */
  isInWebView: boolean;
  /** 마이크 권한 상태 */
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  /** 현재 듣고 있는 중인지 */
  isListening: boolean;
  /** 인식된 텍스트 (원본) */
  transcript: string;
  /** 인식된 글자들 (Sloan 글자로 변환됨) */
  recognizedLetters: string[];
  /** 에러 메시지 */
  error: string | null;
  /** 지원 안 되는 이유 */
  unsupportedReason: string | null;
  /** 마지막 인식된 단어 */
  lastWord: string | null;
  /** 음성인식 시작 */
  startListening: () => void;
  /** 음성인식 중지 */
  stopListening: () => void;
  /** 결과 초기화 */
  resetTranscript: () => void;
  /** 마이크 권한 요청 */
  requestPermission: () => Promise<boolean>;
}

/**
 * 텍스트에서 Sloan 글자 추출
 */
function extractSloanLetters(text: string): string[] {
  const words = text.toLowerCase().split(/[\s,]+/);
  const letters: string[] = [];

  for (const word of words) {
    // 직접 매핑 확인
    if (PRONUNCIATION_MAP[word]) {
      letters.push(PRONUNCIATION_MAP[word]);
      continue;
    }

    // 단일 영문자 확인
    if (word.length === 1 && /[a-z]/.test(word)) {
      const upper = word.toUpperCase();
      if (SLOAN_LETTERS.includes(upper)) {
        letters.push(upper);
      }
      continue;
    }

    // 부분 매칭 (긴 문장에서 글자 추출)
    for (const [key, value] of Object.entries(PRONUNCIATION_MAP)) {
      if (word.includes(key)) {
        letters.push(value);
        break;
      }
    }
  }

  return letters;
}

/**
 * WebView 환경 감지 (더 정확한 버전)
 */
function isWebView(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();

  // Android WebView 감지
  // - 'wv' 플래그 체크
  // - Android에서 Chrome 없이 실행되는 경우
  const isAndroidWebView = userAgent.includes('wv') ||
    (userAgent.includes('android') && !userAgent.includes('chrome')) ||
    (userAgent.includes('android') && userAgent.includes('version/'));

  // iOS WebView 감지 (WKWebView)
  // - Safari 브라우저가 아닌데 iOS인 경우
  // - Apps-in-Toss 같은 앱 내 WebView
  const isIOSWebView = (/iphone|ipad|ipod/.test(userAgent) &&
    !userAgent.includes('safari')) ||
    (window.navigator as any).standalone === true; // PWA 모드도 제한적

  // Toss 앱 내 WebView 감지 (앱인토스)
  const isTossWebView = userAgent.includes('toss') ||
    userAgent.includes('viva') ||
    (typeof (window as any).TossBridge !== 'undefined') ||
    (typeof (window as any).TossInApp !== 'undefined');

  return isAndroidWebView || isIOSWebView || isTossWebView;
}

/**
 * getUserMedia 지원 여부 확인
 */
async function checkMicrophoneSupport(): Promise<boolean> {
  // 기본 API 존재 여부 확인
  if (!navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  // WebView에서는 API가 있어도 실제로 작동 안 할 수 있음
  // 실제 권한 요청을 시도하여 확인
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // 성공하면 즉시 스트림 해제
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    // NotAllowedError: 권한 거부
    // NotFoundError: 마이크 없음
    // NotSupportedError: 지원 안 됨 (WebView에서 자주 발생)
    console.log('Microphone check failed:', err);
    return false;
  }
}

/**
 * 음성인식 커스텀 훅
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const {
    language = 'ko-KR', // 한국어 기본
    continuous = false,
    interimResults = true,
    timeout = 10000, // 10초 타임아웃
  } = options;

  // 상태
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognizedLetters, setRecognizedLetters] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastWord, setLastWord] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean>(false);
  const [microphoneChecked, setMicrophoneChecked] = useState<boolean>(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 환경 체크
  const isInWebView = typeof window !== 'undefined' && isWebView();
  const hasWebSpeechAPI = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  // 전체 지원 여부 (API + 마이크 + WebView 아님)
  const isSupported = hasWebSpeechAPI && hasMicrophoneAccess && !isInWebView;

  // 지원 안 되는 이유 계산
  const unsupportedReason = (() => {
    if (isInWebView) {
      return '앱인토스 WebView 환경에서는 음성인식이 지원되지 않습니다. 버튼으로 입력해 주세요.';
    }
    if (!hasWebSpeechAPI) {
      return '이 브라우저에서는 음성인식을 지원하지 않습니다.';
    }
    if (!hasMicrophoneAccess && microphoneChecked) {
      return '마이크 접근이 거부되었거나 마이크가 없습니다.';
    }
    return null;
  })();

  // 마이크 접근 가능 여부 확인 (최초 1회)
  useEffect(() => {
    if (microphoneChecked || isInWebView || !hasWebSpeechAPI) return;

    // 비동기로 마이크 지원 확인
    checkMicrophoneSupport().then(supported => {
      setHasMicrophoneAccess(supported);
      setMicrophoneChecked(true);
      if (supported) {
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    });
  }, [microphoneChecked, isInWebView, hasWebSpeechAPI]);

  // 마이크 권한 상태 확인
  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus('denied');
      return;
    }

    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(result => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');

        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };
      })
      .catch(() => {
        setPermissionStatus('unknown');
      });
  }, [isSupported]);

  // 음성인식 인스턴스 생성
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 3; // 여러 대안 확인

    // 결과 처리
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(prev => prev + (finalTranscript ? ' ' + finalTranscript : ''));

      // Sloan 글자 추출
      const letters = extractSloanLetters(fullTranscript);
      if (letters.length > 0) {
        setRecognizedLetters(prev => [...prev, ...letters]);
        setLastWord(letters[letters.length - 1]);

        // 타임아웃 리셋
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (timeout > 0 && isListening) {
          timeoutRef.current = setTimeout(() => {
            recognition.stop();
          }, timeout);
        }
      }
    };

    // 에러 처리
    recognition.onerror = (event) => {
      const errorType = event.error as SpeechError;
      setError(ERROR_MESSAGES[errorType] || '알 수 없는 오류가 발생했습니다');
      setIsListening(false);
    };

    // 종료 처리
    recognition.onend = () => {
      setIsListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // 시작 처리
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);

      // 타임아웃 설정
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          recognition.stop();
        }, timeout);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSupported, language, continuous, interimResults, timeout, isListening]);

  // 음성인식 시작
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError(ERROR_MESSAGES['not-supported']);
      return;
    }

    setError(null);
    setRecognizedLetters([]);
    setTranscript('');
    setLastWord(null);

    try {
      recognitionRef.current.start();
    } catch (err) {
      // 이미 실행 중인 경우
      recognitionRef.current.stop();
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 100);
    }
  }, [isSupported]);

  // 음성인식 중지
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 결과 초기화
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setRecognizedLetters([]);
    setLastWord(null);
    setError(null);
  }, []);

  // 마이크 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 스트림 즉시 해제 (권한만 확인)
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      setPermissionStatus('denied');
      setError(ERROR_MESSAGES['not-allowed']);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    hasWebSpeechAPI,
    hasMicrophoneAccess,
    isInWebView,
    permissionStatus,
    isListening,
    transcript,
    recognizedLetters,
    error,
    unsupportedReason,
    lastWord,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
  };
}
