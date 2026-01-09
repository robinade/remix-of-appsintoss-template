/**
 * Premium Health Dashboard Component
 * 
 * Design Philosophy:
 * - Healthcare Neumorphism + Glassmorphism
 * - Trust Blue + Vitality Green color palette
 * - Generous whitespace with clear visual hierarchy
 * - Micro-animations for delightful interactions
 * - 44px+ touch targets for accessibility
 */

import { 
  Eye, 
  Palette, 
  Target, 
  Timer, 
  Activity, 
  Flame,
  ChevronRight,
  Sparkles,
  Lightbulb,
  Scan,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { UserStats, ScreenType } from '../types';

interface HealthDashboardProps {
  stats: UserStats;
  onNavigate: (screen: ScreenType) => void;
}

const DAILY_TIPS = [
  '20분마다 20초간 20피트(6m) 먼 곳을 바라보세요',
  '의식적으로 눈을 자주 깜빡여 건조함을 예방하세요',
  '모니터는 눈높이보다 살짝 아래에 위치시키세요',
  '충분한 수분 섭취가 눈 건강에도 도움이 됩니다',
  '어두운 환경에서 밝은 화면은 눈에 무리를 줍니다',
  '야외 활동으로 자연광을 충분히 쐬세요',
  '블루라이트 차단 안경 사용을 고려해보세요',
];

// Animated progress ring component
function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 10,
  className = ''
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg 
      width={size} 
      height={size} 
      className={`progress-ring ${className}`}
    >
      {/* Track */}
      <circle
        className="progress-ring-track"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ stroke: 'hsl(var(--neutral-200))' }}
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(152, 76%, 44%)" />
          <stop offset="100%" stopColor="hsl(210, 100%, 52%)" />
        </linearGradient>
      </defs>
      {/* Progress fill */}
      <circle
        className="progress-ring-fill"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ 
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          stroke: 'url(#progressGradient)',
        }}
      />
    </svg>
  );
}

// Brand assets
const LOGO_URL = 'https://hoxpxkwgwjupgysobpal.supabase.co/storage/v1/object/public/app-icons/eyemaster_logo.png';

export function HealthDashboard({ stats, onNavigate }: HealthDashboardProps) {
  const { haptic } = useAppsInToss();
  
  const todayTip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];

  const handleCardClick = async (screen: ScreenType) => {
    await haptic('tap');
    onNavigate(screen);
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '매우 좋음';
    if (score >= 60) return '좋음';
    if (score >= 40) return '보통';
    return '관리 필요';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-health-green to-emerald-400';
    if (score >= 60) return 'from-health-blue to-cyan-400';
    if (score >= 40) return 'from-health-amber to-yellow-400';
    return 'from-health-coral to-rose-400';
  };

  return (
    <div className="min-h-screen pb-10">
      {/* ═══════════════════════════════════════════════════════════════════════
       * Header with Logo
       * ═══════════════════════════════════════════════════════════════════════ */}
      <header className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <img 
            src={LOGO_URL} 
            alt="EyeMaster" 
            className="w-10 h-10 rounded-xl object-cover"
            style={{
              boxShadow: '0 4px 12px rgba(49, 130, 246, 0.2)',
            }}
          />
          <div>
            <h1 className="text-title3 text-foreground font-bold">EyeMaster</h1>
            <p className="text-caption2 text-[hsl(var(--neutral-500))]">AI 눈 건강 케어</p>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
       * Hero Section - Health Score with Progress Ring
       * ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-5 pt-4 pb-8">
        {/* Decorative background blobs */}
        <div 
          className="blob-decoration w-40 h-40 -top-10 -right-10"
          style={{ background: 'hsl(var(--health-blue-light))' }}
        />
        <div 
          className="blob-decoration w-32 h-32 top-20 -left-8"
          style={{ background: 'hsl(var(--health-green-light))' }}
        />
        
        <div className="relative z-10">
          {/* Greeting badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200/60 shadow-sm animate-scale-in">
            <Sparkles className="w-4 h-4 text-health-blue" />
            <span className="text-caption1 font-semibold text-neutral-600">오늘도 눈 건강을 지켜요</span>
          </div>
          
          {/* Main score display */}
          <div className="flex items-center gap-6 mb-6 animate-slide-up">
            {/* Progress Ring */}
            <div className="relative">
              <ProgressRing progress={stats.healthScore} size={120} strokeWidth={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-number-lg bg-gradient-to-br from-health-green to-health-blue bg-clip-text text-transparent">
                  {stats.healthScore}
                </span>
                <span className="text-caption2 text-neutral-500 -mt-1">점</span>
              </div>
            </div>
            
            {/* Score info */}
            <div className="flex-1">
              <h1 className="text-title1 text-foreground mb-1">눈 건강 점수</h1>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption1 font-bold text-white bg-gradient-to-r ${getScoreGradient(stats.healthScore)}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {getScoreLabel(stats.healthScore)}
              </div>
            </div>
          </div>
          
          {/* Streak badge */}
          <div className="flex gap-3 animate-slide-up stagger-1">
            <div className="streak-badge">
              <Flame className="w-4 h-4" />
              <span>{stats.streakDays}일 연속</span>
            </div>
            <div className="badge-stat-blue">
              <Zap className="w-3.5 h-3.5" />
              <span>오늘 활성</span>
            </div>
          </div>
        </div>
      </section>

      <main className="px-5 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════════
         * AI Vision Test - Primary CTA
         * ═══════════════════════════════════════════════════════════════════════ */}
        <section className="animate-slide-up stagger-2">
          <button
            onClick={() => handleCardClick('vision-test')}
            className="w-full card-elevated group overflow-hidden"
          >
            {/* Shine effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-700 pointer-events-none" />
            
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="icon-container-lg icon-vivid-blue">
                  <Scan className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-body1 font-bold text-foreground">AI 시력 측정</h3>
                    <span className="px-2 py-0.5 rounded-md bg-health-blue-light text-health-blue text-[10px] font-bold tracking-wide">NEW</span>
                  </div>
                  <p className="text-caption1 text-neutral-500">
                    카메라로 거리 자동 측정 + 정밀 분석
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-active:bg-health-blue group-active:scale-90 transition-all duration-200">
                <ChevronRight className="w-5 h-5 text-neutral-400 group-active:text-white transition-colors" />
              </div>
            </div>
          </button>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
         * Quick Tests - 2x2 Grid
         * ═══════════════════════════════════════════════════════════════════════ */}
        <section className="animate-slide-up stagger-3">
          <div className="section-header">
            <span className="section-title">빠른 테스트</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Color Vision Test */}
            <button
              onClick={() => handleCardClick('color-test')}
              className="card-interactive group text-left"
            >
              <div className="icon-container-md icon-vivid-rainbow mb-4 group-active:scale-95 transition-transform">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <p className="text-body2 font-bold text-foreground mb-0.5">색약 테스트</p>
              <p className="text-caption2 text-neutral-400">Color Vision</p>
            </button>

            {/* Astigmatism Test */}
            <button
              onClick={() => handleCardClick('astigmatism-test')}
              className="card-interactive group text-left"
            >
              <div className="icon-container-md icon-vivid-violet mb-4 group-active:scale-95 transition-transform">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="text-body2 font-bold text-foreground mb-0.5">난시 체크</p>
              <p className="text-caption2 text-neutral-400">Astigmatism</p>
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
         * 20-20-20 Timer
         * ═══════════════════════════════════════════════════════════════════════ */}
        <section className="animate-slide-up stagger-4">
          <button
            onClick={() => handleCardClick('timer')}
            className="w-full card-interactive group overflow-hidden"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-health-green-light/30 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="icon-container-md icon-vivid-green group-active:scale-95 transition-transform">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-body2 font-bold text-foreground">20-20-20 타이머</p>
                  <p className="text-caption1 text-neutral-500">
                    오늘 <span className="text-health-green font-bold">{stats.timerSessions}회</span> 완료
                  </p>
                </div>
              </div>
              <div className="btn-toss-success py-2.5 px-5 text-caption1">
                시작
              </div>
            </div>
          </button>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
         * Eye Exercise Guide
         * ═══════════════════════════════════════════════════════════════════════ */}
        <section>
          <button
            onClick={() => handleCardClick('exercise')}
            className="w-full card-interactive group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="icon-container-md icon-gradient-violet group-active:scale-95 transition-transform">
                  <Activity className="w-6 h-6 text-health-violet" />
                </div>
                <div className="text-left">
                  <p className="text-body2 font-bold text-foreground">눈 운동 가이드</p>
                  <p className="text-caption1 text-neutral-500">
                    8자, 원, 깜빡임, 초점 훈련
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-active:bg-health-violet group-active:scale-90 transition-all duration-200">
                <ChevronRight className="w-5 h-5 text-neutral-400 group-active:text-white transition-colors" />
              </div>
            </div>
          </button>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
         * Daily Tip Card
         * ═══════════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="rounded-3xl p-5 overflow-hidden relative" style={{
            background: 'linear-gradient(135deg, hsl(var(--health-amber-light)) 0%, hsl(38 100% 96%) 100%)',
            border: '1px solid hsl(var(--health-amber) / 0.2)',
          }}>
            {/* Decorative icon */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10" style={{
              background: 'hsl(var(--health-amber))',
            }} />
            
            <div className="flex items-start gap-4 relative">
              <div className="icon-container-md flex-shrink-0" style={{
                background: 'linear-gradient(135deg, hsl(var(--health-amber)) 0%, hsl(25 100% 55%) 100%)',
                boxShadow: '0 4px 12px hsl(var(--health-amber) / 0.3)',
              }}>
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label text-amber-700 mb-2">오늘의 눈 건강 팁</p>
                <p className="text-body2 text-amber-900 leading-relaxed">{todayTip}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
         * Activity Stats
         * ═══════════════════════════════════════════════════════════════════════ */}
        <section className="pb-4">
          <div className="section-header">
            <span className="section-title">내 활동</span>
          </div>
          
          <div className="card-toss">
            <div className="grid grid-cols-3 gap-2">
              {/* Total Tests */}
              <div className="text-center py-3">
                <div className="icon-container-sm icon-gradient-blue mx-auto mb-3">
                  <Eye className="w-5 h-5 text-health-blue" />
                </div>
                <p className="text-number-sm text-foreground mb-0.5">{stats.totalTests}</p>
                <p className="text-caption2 text-neutral-400">총 테스트</p>
              </div>
              
              {/* Divider */}
              <div className="relative flex items-center">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-neutral-200" />
                
                {/* Timer Sessions */}
                <div className="text-center py-3 w-full">
                  <div className="icon-container-sm icon-gradient-green mx-auto mb-3">
                    <Timer className="w-5 h-5 text-health-green" />
                  </div>
                  <p className="text-number-sm text-foreground mb-0.5">{stats.timerSessions}</p>
                  <p className="text-caption2 text-neutral-400">타이머</p>
                </div>
                
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-neutral-200" />
              </div>
              
              {/* Exercise Sessions */}
              <div className="text-center py-3">
                <div className="icon-container-sm icon-gradient-violet mx-auto mb-3">
                  <Activity className="w-5 h-5 text-health-violet" />
                </div>
                <p className="text-number-sm text-foreground mb-0.5">{stats.exerciseSessions}</p>
                <p className="text-caption2 text-neutral-400">운동</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
