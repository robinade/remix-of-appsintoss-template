/**
 * 홈 대시보드 컴포넌트
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
  Trophy,
  Lightbulb,
  Scan,
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

export function HealthDashboard({ stats, onNavigate }: HealthDashboardProps) {
  const { haptic } = useAppsInToss();
  
  const todayTip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];

  const handleCardClick = async (screen: ScreenType) => {
    await haptic('tap');
    onNavigate(screen);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '매우 좋음';
    if (score >= 60) return '좋음';
    if (score >= 40) return '보통';
    return '관리 필요';
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 pb-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-caption1 font-medium opacity-90">AI VISION ENABLED</span>
          </div>
          <h1 className="text-title1 mb-1">눈 건강 마스터</h1>
          <p className="text-body2 opacity-80 mb-6">
            AI가 당신의 눈 건강을 관리합니다
          </p>

          {/* 점수 카드 */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-caption2 opacity-80 mb-1">건강 점수</p>
              <p className="text-3xl font-black">{stats.healthScore}</p>
              <p className="text-caption2 opacity-80">{getScoreLabel(stats.healthScore)}</p>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-1 mb-1">
                <Flame className="w-4 h-4" />
                <p className="text-caption2 opacity-80">연속</p>
              </div>
              <p className="text-3xl font-black">{stats.streakDays}</p>
              <p className="text-caption2 opacity-80">일째</p>
            </div>
          </div>
        </div>

        {/* 데코레이션 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </section>

      <main className="px-5 -mt-4 relative z-10">
        {/* 시력 테스트 CTA */}
        <section className="mb-6">
          <button
            onClick={() => handleCardClick('calibration')}
            className="w-full bg-card rounded-2xl p-5 shadow-lg border border-border text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Scan className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-body1 font-bold text-foreground">AI 시력 측정</h3>
                  <p className="text-caption1 text-muted-foreground">
                    카메라로 거리 자동 측정
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </section>

        {/* 빠른 액션 그리드 */}
        <section className="mb-6">
          <h2 className="text-caption1 font-semibold text-muted-foreground mb-3">빠른 테스트</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCardClick('color-test')}
              className="bg-card rounded-2xl p-4 border border-border text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 via-green-400 to-blue-400 flex items-center justify-center mb-3">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <p className="text-body2 font-semibold text-foreground">색약 테스트</p>
              <p className="text-caption2 text-muted-foreground">Color Vision</p>
            </button>

            <button
              onClick={() => handleCardClick('astigmatism-test')}
              className="bg-card rounded-2xl p-4 border border-border text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <p className="text-body2 font-semibold text-foreground">난시 체크</p>
              <p className="text-caption2 text-muted-foreground">Astigmatism</p>
            </button>
          </div>
        </section>

        {/* 20-20-20 타이머 */}
        <section className="mb-6">
          <button
            onClick={() => handleCardClick('timer')}
            className="w-full bg-card rounded-2xl p-4 border border-border text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-body2 font-semibold text-foreground">20-20-20 타이머</p>
                  <p className="text-caption1 text-muted-foreground">
                    오늘 {stats.timerSessions}회 완료
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-success/10 text-success text-caption1 font-semibold">
                시작
              </div>
            </div>
          </button>
        </section>

        {/* 눈 운동 */}
        <section className="mb-6">
          <button
            onClick={() => handleCardClick('exercise')}
            className="w-full bg-card rounded-2xl p-4 border border-border text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-body2 font-semibold text-foreground">눈 운동 가이드</p>
                  <p className="text-caption1 text-muted-foreground">
                    8자, 원, 깜빡임, 초점 훈련
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </section>

        {/* 오늘의 팁 */}
        <section className="mb-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-caption1 font-semibold text-amber-700 mb-1">오늘의 눈 건강 팁</p>
                <p className="text-body2 text-amber-900">{todayTip}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 통계 요약 */}
        <section>
          <h2 className="text-caption1 font-semibold text-muted-foreground mb-3">내 활동</h2>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <p className="text-title3 font-bold text-foreground">{stats.totalTests}</p>
                <p className="text-caption2 text-muted-foreground">총 테스트</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                  <Timer className="w-5 h-5 text-success" />
                </div>
                <p className="text-title3 font-bold text-foreground">{stats.timerSessions}</p>
                <p className="text-caption2 text-muted-foreground">타이머</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-title3 font-bold text-foreground">{stats.exerciseSessions}</p>
                <p className="text-caption2 text-muted-foreground">운동</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
