/**
 * Eyeri (아이리) - Eye Master 마스코트 캐릭터
 * 귀여운 눈 모양 캐릭터로 사용자에게 격려와 팁 제공
 */

import { useState, useEffect } from 'react';

export type EyeriMood =
  | 'happy'     // 좋은 결과, 운동 완료
  | 'excited'   // 연속 기록, 업적 달성
  | 'concerned' // 나쁜 결과, 휴식 건너뜀
  | 'sleepy'    // 휴식 알림
  | 'cheering'  // 응원, 격려
  | 'thinking'  // 로딩, 분석 중
  | 'wink'      // 팁 제공
  | 'default';  // 기본 상태

interface EyeriCharacterProps {
  mood?: EyeriMood;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showMessage?: boolean;
  animate?: boolean;
  className?: string;
}

// 무드별 메시지
const MOOD_MESSAGES: Record<EyeriMood, string[]> = {
  happy: [
    '잘했어요! 눈이 시원해졌죠?',
    '오늘도 눈 건강 지키기 성공!',
    '훌륭해요! 계속 이렇게 해요!',
    '눈이 환해지는 느낌이에요!',
  ],
  excited: [
    '와! 대단해요! 연속 기록이에요!',
    '축하해요! 새 업적을 달성했어요!',
    '정말 열심히 하고 있네요!',
    '눈이 반짝반짝 빛나요!',
  ],
  concerned: [
    '눈이 피곤해 보여요...',
    '좀 쉬어가는 건 어때요?',
    '눈 건강을 챙겨주세요~',
    '오늘은 조금 힘들었나요?',
  ],
  sleepy: [
    '(하품) 눈이 쉬고 싶대요~',
    '잠깐 멀리 바라보는 건 어때요?',
    '20분이 지났어요! 쉬어가요~',
    '눈이 졸려하고 있어요...',
  ],
  cheering: [
    '힘내세요! 할 수 있어요!',
    '오늘도 화이팅!',
    '눈 건강은 제가 도와줄게요!',
    '함께 눈 건강 지켜요!',
  ],
  thinking: [
    '음... 분석 중이에요!',
    '잠시만요, 확인 중!',
    '데이터를 살펴보는 중...',
  ],
  wink: [
    '알고 계셨나요? 깜빡임은 눈물막을 보호해요!',
    '팁: 20분마다 20초간 20피트 먼 곳을 봐요!',
    '눈 주변 마사지는 혈액순환에 좋아요!',
    '어두운 곳에서 스마트폰은 눈에 안 좋아요!',
  ],
  default: [
    '안녕하세요! 아이리예요!',
    '오늘 눈 건강은 어때요?',
    '함께 눈 운동해요!',
  ],
};

// 무드별 이모지 추가
const MOOD_ACCESSORIES: Record<EyeriMood, string | null> = {
  happy: null,
  excited: '✨',
  concerned: '💧',
  sleepy: '💤',
  cheering: '💪',
  thinking: '🔍',
  wink: '💡',
  default: null,
};

export function EyeriCharacter({
  mood = 'default',
  message,
  size = 'medium',
  showMessage = true,
  animate = true,
  className = '',
}: EyeriCharacterProps) {
  const [blinking, setBlinking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isWinking, setIsWinking] = useState(false);

  // 사이즈별 스타일
  const sizeStyles = {
    small: { container: 'w-16 h-16', eye: 'w-5 h-5', pupil: 'w-2 h-2', highlight: 'w-1 h-1' },
    medium: { container: 'w-24 h-24', eye: 'w-8 h-8', pupil: 'w-3 h-3', highlight: 'w-1.5 h-1.5' },
    large: { container: 'w-32 h-32', eye: 'w-10 h-10', pupil: 'w-4 h-4', highlight: 'w-2 h-2' },
  };

  const styles = sizeStyles[size];

  // 깜빡임 애니메이션
  useEffect(() => {
    if (!animate) return;

    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [animate]);

  // 윙크 (wink mood일 때)
  useEffect(() => {
    if (mood === 'wink' && animate) {
      const winkInterval = setInterval(() => {
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 300);
      }, 2500);
      return () => clearInterval(winkInterval);
    }
  }, [mood, animate]);

  // 메시지 설정
  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
    } else {
      const messages = MOOD_MESSAGES[mood];
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, [mood, message]);

  // 무드별 색상
  const getMoodColors = () => {
    switch (mood) {
      case 'happy':
        return { bg: 'bg-gradient-to-br from-amber-100 to-yellow-200', border: 'border-amber-300', pupil: 'bg-amber-600' };
      case 'excited':
        return { bg: 'bg-gradient-to-br from-pink-100 to-rose-200', border: 'border-pink-300', pupil: 'bg-pink-600' };
      case 'concerned':
        return { bg: 'bg-gradient-to-br from-blue-100 to-slate-200', border: 'border-blue-300', pupil: 'bg-blue-600' };
      case 'sleepy':
        return { bg: 'bg-gradient-to-br from-purple-100 to-indigo-200', border: 'border-purple-300', pupil: 'bg-purple-600' };
      case 'cheering':
        return { bg: 'bg-gradient-to-br from-green-100 to-emerald-200', border: 'border-green-300', pupil: 'bg-green-600' };
      case 'thinking':
        return { bg: 'bg-gradient-to-br from-cyan-100 to-sky-200', border: 'border-cyan-300', pupil: 'bg-cyan-600' };
      case 'wink':
        return { bg: 'bg-gradient-to-br from-orange-100 to-amber-200', border: 'border-orange-300', pupil: 'bg-orange-600' };
      default:
        return { bg: 'bg-gradient-to-br from-blue-100 to-sky-200', border: 'border-blue-300', pupil: 'bg-blue-600' };
    }
  };

  // 눈 표정
  const getEyeExpression = () => {
    if (blinking || mood === 'sleepy') {
      return 'scale-y-[0.1]';
    }
    if (mood === 'happy' || mood === 'excited') {
      return 'scale-y-[0.7]'; // 웃는 눈 (살짝 찡그림)
    }
    if (mood === 'concerned') {
      return ''; // 기본, 눈썹으로 표현
    }
    return '';
  };

  const colors = getMoodColors();
  const accessory = MOOD_ACCESSORIES[mood];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* 캐릭터 */}
      <div className="relative">
        {/* 악세서리 */}
        {accessory && (
          <div className="absolute -top-2 -right-2 text-xl animate-bounce z-10">
            {accessory}
          </div>
        )}

        {/* 메인 얼굴 (큰 원) */}
        <div
          className={`
            ${styles.container} ${colors.bg} ${colors.border}
            rounded-full border-4 flex items-center justify-center
            shadow-lg relative overflow-hidden
            ${animate ? 'animate-[float_3s_ease-in-out_infinite]' : ''}
          `}
          style={{
            animation: animate ? 'float 3s ease-in-out infinite' : undefined,
          }}
        >
          {/* 볼터치 (happy/excited) */}
          {(mood === 'happy' || mood === 'excited') && (
            <>
              <div className="absolute left-2 top-1/2 w-3 h-2 bg-pink-300/50 rounded-full blur-[2px]" />
              <div className="absolute right-2 top-1/2 w-3 h-2 bg-pink-300/50 rounded-full blur-[2px]" />
            </>
          )}

          {/* 눈썹 (concerned) */}
          {mood === 'concerned' && (
            <>
              <div className="absolute left-1/4 top-1/4 w-4 h-0.5 bg-foreground/60 rounded -rotate-12" />
              <div className="absolute right-1/4 top-1/4 w-4 h-0.5 bg-foreground/60 rounded rotate-12" />
            </>
          )}

          {/* 눈들 */}
          <div className="flex gap-3">
            {/* 왼쪽 눈 */}
            <div
              className={`
                ${styles.eye} bg-white rounded-full border-2 border-foreground/30
                flex items-center justify-center transition-all duration-150
                ${getEyeExpression()}
                ${isWinking ? 'scale-y-[0.1]' : ''}
              `}
            >
              {!blinking && !isWinking && mood !== 'sleepy' && (
                <div className={`${styles.pupil} ${colors.pupil} rounded-full relative`}>
                  <div className={`absolute top-0.5 left-0.5 ${styles.highlight} bg-white rounded-full`} />
                </div>
              )}
            </div>

            {/* 오른쪽 눈 */}
            <div
              className={`
                ${styles.eye} bg-white rounded-full border-2 border-foreground/30
                flex items-center justify-center transition-all duration-150
                ${getEyeExpression()}
              `}
            >
              {!blinking && mood !== 'sleepy' && (
                <div className={`${styles.pupil} ${colors.pupil} rounded-full relative`}>
                  <div className={`absolute top-0.5 left-0.5 ${styles.highlight} bg-white rounded-full`} />
                </div>
              )}
            </div>
          </div>

          {/* 입 */}
          <div className="absolute bottom-[20%]">
            {mood === 'happy' || mood === 'excited' ? (
              <div className="w-6 h-3 border-b-2 border-foreground/60 rounded-b-full" />
            ) : mood === 'concerned' ? (
              <div className="w-4 h-2 border-t-2 border-foreground/60 rounded-t-full" />
            ) : mood === 'sleepy' ? (
              <div className="w-3 h-2 bg-foreground/20 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-foreground/40 rounded-full" />
            )}
          </div>
        </div>

        {/* ZZZ (sleepy) */}
        {mood === 'sleepy' && (
          <div className="absolute -top-4 -right-2 text-xs text-purple-500 font-bold animate-pulse">
            z<span className="text-sm">z</span><span className="text-base">z</span>
          </div>
        )}
      </div>

      {/* 말풍선 메시지 */}
      {showMessage && currentMessage && (
        <div className="relative max-w-[200px]">
          {/* 말풍선 꼬리 */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l border-t border-border rotate-45" />

          {/* 말풍선 */}
          <div className="relative bg-card rounded-xl border border-border px-4 py-2 shadow-md">
            <p className="text-caption1 text-foreground text-center leading-relaxed">
              {currentMessage}
            </p>
          </div>
        </div>
      )}

      {/* 플로팅 애니메이션 키프레임 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

// 특정 상황에서 사용할 프리셋 컴포넌트들
export function EyeriHappy({ message, size = 'medium' }: { message?: string; size?: 'small' | 'medium' | 'large' }) {
  return <EyeriCharacter mood="happy" message={message} size={size} />;
}

export function EyeriExcited({ message, size = 'medium' }: { message?: string; size?: 'small' | 'medium' | 'large' }) {
  return <EyeriCharacter mood="excited" message={message} size={size} />;
}

export function EyeriSleepy({ message, size = 'medium' }: { message?: string; size?: 'small' | 'medium' | 'large' }) {
  return <EyeriCharacter mood="sleepy" message={message} size={size} />;
}

export function EyeriCheering({ message, size = 'medium' }: { message?: string; size?: 'small' | 'medium' | 'large' }) {
  return <EyeriCharacter mood="cheering" message={message} size={size} />;
}

export function EyeriTip({ tip, size = 'medium' }: { tip?: string; size?: 'small' | 'medium' | 'large' }) {
  return <EyeriCharacter mood="wink" message={tip} size={size} />;
}
