/**
 * Progress Dashboard Component
 * 눈 건강 진행 현황 대시보드 (차트 포함)
 */

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAchievements } from '../hooks/useAchievements';
import { EyeriCharacter } from './EyeriCharacter';
import { PointsDisplay } from './AchievementSystem';
import type { UserStats, VisionTestResult, DailyCheckin } from '../types';
import { STORAGE_KEYS } from '../types';

interface ProgressDashboardProps {
  className?: string;
}

// 색상 팔레트
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#94a3b8',
};

// 건강 점수 색상
function getHealthScoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
}

// 건강 점수 등급
function getHealthGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: 'A+', label: '매우 우수', color: COLORS.success };
  if (score >= 80) return { grade: 'A', label: '우수', color: COLORS.success };
  if (score >= 70) return { grade: 'B', label: '양호', color: COLORS.info };
  if (score >= 60) return { grade: 'C', label: '보통', color: COLORS.warning };
  if (score >= 50) return { grade: 'D', label: '주의 필요', color: COLORS.warning };
  return { grade: 'F', label: '관리 필요', color: COLORS.danger };
}

// 활동 히트맵 데이터 생성 (최근 12주)
function generateHeatmapData(): { week: number; day: number; count: number; date: string }[] {
  const data: { week: number; day: number; count: number; date: string }[] = [];
  const today = new Date();

  for (let week = 11; week >= 0; week--) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + (6 - day)));
      const dateStr = date.toISOString().split('T')[0];

      // 실제 데이터에서 활동 카운트 가져오기 (시뮬레이션)
      const count = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;

      data.push({
        week: 11 - week,
        day,
        count,
        date: dateStr,
      });
    }
  }

  return data;
}

// 주간 활동 데이터 생성
function generateWeeklyData(): { day: string; exercises: number; tests: number; timer: number }[] {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  return days.map(day => ({
    day,
    exercises: Math.floor(Math.random() * 5),
    tests: Math.floor(Math.random() * 2),
    timer: Math.floor(Math.random() * 8),
  }));
}

// 시력 트렌드 데이터
function generateVisionTrend(): { date: string; left: number; right: number; both: number }[] {
  const data: { date: string; left: number; right: number; both: number }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    data.push({
      date: `${date.getMonth() + 1}월`,
      left: 0.8 + Math.random() * 0.4,
      right: 0.7 + Math.random() * 0.5,
      both: 0.9 + Math.random() * 0.3,
    });
  }

  return data;
}

// 활동 분포 데이터
function generateActivityDistribution(): { name: string; value: number; color: string }[] {
  return [
    { name: '눈 운동', value: 45, color: COLORS.primary },
    { name: '20-20-20', value: 30, color: COLORS.secondary },
    { name: '시력 검사', value: 15, color: COLORS.success },
    { name: '색각 검사', value: 5, color: COLORS.warning },
    { name: '난시 검사', value: 5, color: COLORS.info },
  ];
}

// 건강 점수 게이지 컴포넌트
function HealthScoreGauge({ score }: { score: number }) {
  const { grade, label, color } = getHealthGrade(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* 배경 원 */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#e2e8f0"
          strokeWidth="8"
          fill="none"
        />
        {/* 진행 원 */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{grade}</span>
        <span className="text-caption2 text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// 활동 히트맵 컴포넌트
function ActivityHeatmap({ data }: { data: { week: number; day: number; count: number; date: string }[] }) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const getColor = (count: number) => {
    if (count === 0) return '#f1f5f9';
    if (count === 1) return '#bfdbfe';
    if (count === 2) return '#93c5fd';
    if (count === 3) return '#60a5fa';
    if (count === 4) return '#3b82f6';
    return '#2563eb';
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {/* 요일 레이블 */}
        <div className="flex flex-col gap-1 mr-2">
          {days.map(day => (
            <div key={day} className="w-6 h-3 text-caption2 text-muted-foreground text-right pr-1">
              {day}
            </div>
          ))}
        </div>

        {/* 히트맵 그리드 */}
        {Array.from({ length: 12 }, (_, week) => (
          <div key={week} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, day) => {
              const cell = data.find(d => d.week === week && d.day === day);
              return (
                <div
                  key={day}
                  className="w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-primary"
                  style={{ backgroundColor: getColor(cell?.count || 0) }}
                  title={cell ? `${cell.date}: ${cell.count}회 활동` : ''}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1 mt-2 text-caption2 text-muted-foreground">
        <span>적음</span>
        {[0, 1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(level) }}
          />
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  icon,
  label,
  value,
  subValue,
  color = COLORS.primary,
}: {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-caption1 text-muted-foreground">{label}</p>
          <p className="text-h4 font-bold" style={{ color }}>{value}</p>
          {subValue && (
            <p className="text-caption2 text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 메인 대시보드 컴포넌트
export function ProgressDashboard({ className = '' }: ProgressDashboardProps) {
  const { points, level, completedAchievements, dailyChallenges } = useAchievements();
  const [activeChart, setActiveChart] = useState<'weekly' | 'vision' | 'heatmap'>('weekly');

  // 데이터 생성 (실제 앱에서는 로컬 스토리지/API에서 가져옴)
  const heatmapData = useMemo(() => generateHeatmapData(), []);
  const weeklyData = useMemo(() => generateWeeklyData(), []);
  const visionTrend = useMemo(() => generateVisionTrend(), []);
  const activityDistribution = useMemo(() => generateActivityDistribution(), []);

  // 건강 점수 계산 (실제 앱에서는 다양한 지표 기반으로 계산)
  const healthScore = 75;

  // 오늘 완료한 챌린지 수
  const completedChallenges = dailyChallenges.filter(c => c.completed).length;

  // 연속 기록 (더미 데이터)
  const streakDays = 7;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더: Eyeri + 포인트 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EyeriCharacter
            mood={healthScore >= 70 ? 'happy' : 'concerned'}
            size="small"
            showMessage={false}
          />
          <div>
            <p className="text-body2 font-bold">오늘도 눈 건강 화이팅!</p>
            <p className="text-caption1 text-muted-foreground">
              {streakDays}일 연속 관리 중 🔥
            </p>
          </div>
        </div>
        <PointsDisplay />
      </div>

      {/* 메인 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon="👁️"
          label="건강 점수"
          value={healthScore}
          subValue={getHealthGrade(healthScore).label}
          color={getHealthScoreColor(healthScore)}
        />
        <StatCard
          icon="🔥"
          label="연속 기록"
          value={`${streakDays}일`}
          subValue="최고 기록: 14일"
          color={COLORS.warning}
        />
        <StatCard
          icon="🏆"
          label="달성 업적"
          value={completedAchievements.length}
          subValue={`총 ${20}개 중`}
          color={COLORS.success}
        />
        <StatCard
          icon="📝"
          label="오늘 챌린지"
          value={`${completedChallenges}/${dailyChallenges.length}`}
          subValue="완료"
          color={COLORS.info}
        />
      </div>

      {/* 건강 점수 상세 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
        <div className="flex items-center gap-6">
          <HealthScoreGauge score={healthScore} />
          <div className="flex-1 space-y-3">
            <h3 className="text-h4 font-bold">눈 건강 종합 점수</h3>
            <div className="space-y-2">
              {[
                { label: '운동 활동', value: 80, color: COLORS.primary },
                { label: '휴식 습관', value: 70, color: COLORS.secondary },
                { label: '검사 빈도', value: 65, color: COLORS.success },
                { label: '연속 관리', value: 85, color: COLORS.warning },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-caption1 mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 차트 탭 선택 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['weekly', 'vision', 'heatmap'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveChart(tab)}
            className={`
              px-4 py-2 rounded-lg text-caption1 font-medium whitespace-nowrap transition-all
              ${activeChart === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab === 'weekly' ? '주간 활동' : tab === 'vision' ? '시력 추이' : '활동 기록'}
          </button>
        ))}
      </div>

      {/* 주간 활동 차트 */}
      {activeChart === 'weekly' && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h4 className="text-body1 font-bold mb-4">이번 주 활동</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="exercises" fill={COLORS.primary} name="운동" radius={[4, 4, 0, 0]} />
                <Bar dataKey="timer" fill={COLORS.secondary} name="타이머" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tests" fill={COLORS.success} name="검사" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-caption2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.primary }} />
              <span>운동</span>
            </div>
            <div className="flex items-center gap-1.5 text-caption2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.secondary }} />
              <span>타이머</span>
            </div>
            <div className="flex items-center gap-1.5 text-caption2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.success }} />
              <span>검사</span>
            </div>
          </div>
        </div>
      )}

      {/* 시력 추이 차트 */}
      {activeChart === 'vision' && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h4 className="text-body1 font-bold mb-4">시력 변화 추이</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0.5, 1.5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => value.toFixed(2)}
                />
                <Line
                  type="monotone"
                  dataKey="left"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="왼쪽"
                />
                <Line
                  type="monotone"
                  dataKey="right"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="오른쪽"
                />
                <Line
                  type="monotone"
                  dataKey="both"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="양안"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-caption2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
              <span>왼쪽 눈</span>
            </div>
            <div className="flex items-center gap-1.5 text-caption2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
              <span>오른쪽 눈</span>
            </div>
            <div className="flex items-center gap-1.5 text-caption2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
              <span>양안</span>
            </div>
          </div>
        </div>
      )}

      {/* 활동 히트맵 */}
      {activeChart === 'heatmap' && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h4 className="text-body1 font-bold mb-4">최근 12주 활동 기록</h4>
          <ActivityHeatmap data={heatmapData} />
        </div>
      )}

      {/* 활동 분포 */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h4 className="text-body1 font-bold mb-4">활동 분포</h4>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {activityDistribution.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-caption1 flex-1">{item.name}</span>
                <span className="text-caption1 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 팁 카드 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex items-start gap-3">
          <EyeriCharacter mood="wink" size="small" showMessage={false} />
          <div>
            <p className="text-body2 font-bold text-amber-800 mb-1">아이리의 오늘의 팁</p>
            <p className="text-caption1 text-amber-700">
              휴식 습관이 조금 부족해요! 20-20-20 타이머를 더 자주 사용해보는 건 어떨까요?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
