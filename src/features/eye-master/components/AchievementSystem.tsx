/**
 * Achievement System Component
 * 업적 시스템 및 일일 챌린지 UI
 */

import { useState } from 'react';
import { useAchievements, ACHIEVEMENTS, calculateLevel, getPointsForLevel } from '../hooks/useAchievements';
import { EyeriCharacter } from './EyeriCharacter';
import type { Achievement, DailyChallenge } from '../types';

interface AchievementSystemProps {
  className?: string;
}

// 업적 카드 컴포넌트
function AchievementCard({
  achievement,
  progress,
  isNew = false,
}: {
  achievement: Achievement;
  progress?: { currentValue: number; completed: boolean; completedAt?: string };
  isNew?: boolean;
}) {
  const progressValue = progress?.currentValue || 0;
  const percentage = Math.min(100, (progressValue / achievement.condition.target) * 100);
  const isCompleted = progress?.completed || false;

  return (
    <div
      className={`
        relative p-4 rounded-2xl border-2 transition-all duration-300
        ${isCompleted
          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300'
          : 'bg-card border-border hover:border-primary/30'
        }
        ${isNew ? 'animate-pulse ring-2 ring-amber-400' : ''}
      `}
    >
      {/* 새 업적 표시 */}
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
          NEW!
        </div>
      )}

      {/* 아이콘 및 정보 */}
      <div className="flex items-start gap-3">
        <div
          className={`
            text-3xl w-12 h-12 flex items-center justify-center rounded-xl
            ${isCompleted ? 'bg-amber-200' : 'bg-muted grayscale'}
          `}
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold ${isCompleted ? 'text-amber-700' : 'text-foreground'}`}>
              {achievement.name}
            </h4>
            {isCompleted && <span className="text-green-600">✓</span>}
          </div>
          <p className="text-caption1 text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>

          {/* 진행 바 */}
          {!isCompleted && (
            <div className="mt-2">
              <div className="flex justify-between text-caption2 text-muted-foreground mb-1">
                <span>{progressValue} / {achievement.condition.target}</span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* 보상 표시 */}
          <div className="mt-2 flex items-center gap-1 text-caption1">
            <span className="text-amber-500">⭐</span>
            <span className={isCompleted ? 'text-amber-600' : 'text-muted-foreground'}>
              +{achievement.reward} 포인트
            </span>
            {isCompleted && progress?.completedAt && (
              <span className="text-muted-foreground ml-auto">
                {new Date(progress.completedAt).toLocaleDateString('ko-KR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 일일 챌린지 카드
function DailyChallengeCard({ challenge }: { challenge: DailyChallenge }) {
  const percentage = Math.min(100, (challenge.current / challenge.target) * 100);

  const typeIcons = {
    exercise: '💪',
    timer: '⏰',
    test: '🔬',
    streak: '🔥',
    checkin: '📝',
  };

  return (
    <div
      className={`
        p-3 rounded-xl border transition-all duration-300
        ${challenge.completed
          ? 'bg-green-50 border-green-300'
          : 'bg-card border-border'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            text-2xl w-10 h-10 flex items-center justify-center rounded-lg
            ${challenge.completed ? 'bg-green-200' : 'bg-muted'}
          `}
        >
          {typeIcons[challenge.type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-body2 font-medium ${challenge.completed ? 'text-green-700' : 'text-foreground'}`}>
              {challenge.task}
            </p>
            {challenge.completed && <span className="text-green-600">✓</span>}
          </div>

          {/* 진행 바 */}
          <div className="mt-1.5">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${challenge.completed ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-caption2 text-muted-foreground mt-1">
              <span>{challenge.current} / {challenge.target}</span>
              <span className="flex items-center gap-1">
                <span className="text-amber-500">⭐</span>
                +{challenge.reward}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 레벨 프로그레스 컴포넌트
function LevelProgress({
  level,
  points,
  pointsToNextLevel,
  currentLevelPoints,
  nextLevelPoints,
}: {
  level: number;
  points: number;
  pointsToNextLevel: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
}) {
  const progressInLevel = points - currentLevelPoints;
  const totalForLevel = nextLevelPoints - currentLevelPoints;
  const percentage = (progressInLevel / totalForLevel) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">{level}</span>
          </div>
          <div>
            <p className="text-body2 font-bold text-purple-800">레벨 {level}</p>
            <p className="text-caption1 text-purple-600">{points.toLocaleString()} 포인트</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-caption2 text-purple-600">다음 레벨까지</p>
          <p className="text-body1 font-bold text-purple-800">{pointsToNextLevel.toLocaleString()}</p>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-3 bg-purple-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex justify-between text-caption2 text-purple-600 mt-1">
        <span>{currentLevelPoints}</span>
        <span>{nextLevelPoints}</span>
      </div>
    </div>
  );
}

// 업적 달성 알림 모달
function AchievementUnlockedModal({
  achievements,
  onClose,
}: {
  achievements: Achievement[];
  onClose: () => void;
}) {
  if (achievements.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
        {/* 축하 아이콘 */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">🎉</div>
          <h2 className="text-h3 font-bold text-foreground">업적 달성!</h2>
        </div>

        {/* 달성한 업적들 */}
        <div className="space-y-3 mb-6">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200"
            >
              <div className="text-3xl">{achievement.icon}</div>
              <div className="flex-1">
                <p className="font-bold text-amber-800">{achievement.name}</p>
                <p className="text-caption2 text-amber-600">{achievement.description}</p>
              </div>
              <div className="text-right">
                <span className="text-amber-600 font-bold">+{achievement.reward}</span>
                <span className="text-amber-500 ml-1">⭐</span>
              </div>
            </div>
          ))}
        </div>

        {/* Eyeri 캐릭터 */}
        <div className="flex justify-center mb-4">
          <EyeriCharacter mood="excited" size="small" showMessage={false} />
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export function AchievementSystem({ className = '' }: AchievementSystemProps) {
  const {
    points,
    level,
    achievements,
    dailyChallenges,
    completedAchievements,
    pendingAchievements,
    newlyUnlocked,
    pointsToNextLevel,
    nextLevelPoints,
    currentLevelPoints,
    getAchievementProgress,
    clearNewlyUnlocked,
  } = useAchievements();

  const [activeTab, setActiveTab] = useState<'challenges' | 'achievements'>('challenges');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredAchievements =
    achievementFilter === 'completed'
      ? completedAchievements
      : achievementFilter === 'pending'
        ? pendingAchievements
        : ACHIEVEMENTS;

  // 카테고리별 그룹화
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryNames = {
    test: '검사',
    exercise: '운동',
    streak: '연속 기록',
    special: '특별',
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 업적 달성 모달 */}
      <AchievementUnlockedModal
        achievements={newlyUnlocked}
        onClose={clearNewlyUnlocked}
      />

      {/* 레벨 프로그레스 */}
      <LevelProgress
        level={level}
        points={points}
        pointsToNextLevel={pointsToNextLevel}
        currentLevelPoints={currentLevelPoints}
        nextLevelPoints={nextLevelPoints}
      />

      {/* 탭 선택 */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`
            flex-1 py-2.5 rounded-lg text-body2 font-medium transition-all
            ${activeTab === 'challenges'
              ? 'bg-card text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          오늘의 챌린지
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`
            flex-1 py-2.5 rounded-lg text-body2 font-medium transition-all
            ${activeTab === 'achievements'
              ? 'bg-card text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          업적 ({completedAchievements.length}/{ACHIEVEMENTS.length})
        </button>
      </div>

      {/* 일일 챌린지 탭 */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-h4 font-bold">오늘의 챌린지</h3>
            <div className="flex items-center gap-1 text-caption1 text-muted-foreground">
              <span>{dailyChallenges.filter(c => c.completed).length}/{dailyChallenges.length} 완료</span>
            </div>
          </div>

          {dailyChallenges.length > 0 ? (
            <div className="space-y-3">
              {dailyChallenges.map(challenge => (
                <DailyChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <EyeriCharacter mood="thinking" size="small" message="챌린지 로딩 중..." />
            </div>
          )}

          {/* 보상 요약 */}
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption1 text-amber-700">오늘 획득 가능한 포인트</p>
                <p className="text-h4 font-bold text-amber-800">
                  {dailyChallenges
                    .filter(c => !c.completed)
                    .reduce((sum, c) => sum + c.reward, 0)} ⭐
                </p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>
        </div>
      )}

      {/* 업적 탭 */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* 필터 */}
          <div className="flex gap-2">
            {(['all', 'completed', 'pending'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setAchievementFilter(filter)}
                className={`
                  px-3 py-1.5 rounded-lg text-caption1 font-medium transition-all
                  ${achievementFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {filter === 'all' ? '전체' : filter === 'completed' ? '달성' : '미달성'}
              </button>
            ))}
          </div>

          {/* 카테고리별 업적 */}
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category}>
              <h4 className="text-body1 font-bold text-muted-foreground mb-3 flex items-center gap-2">
                {categoryNames[category as keyof typeof categoryNames] || category}
                <span className="text-caption1 font-normal">
                  ({categoryAchievements.filter(a => getAchievementProgress(a.id)?.completed).length}/{categoryAchievements.length})
                </span>
              </h4>
              <div className="space-y-3">
                {categoryAchievements.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    progress={getAchievementProgress(achievement.id) || undefined}
                    isNew={newlyUnlocked.some(a => a.id === achievement.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 간단한 업적 뱃지 컴포넌트 (다른 화면에서 사용)
export function AchievementBadge({ achievementId }: { achievementId: string }) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  const { getAchievementProgress } = useAchievements();
  const progress = getAchievementProgress(achievementId);

  if (!achievement) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-caption2
        ${progress?.completed
          ? 'bg-amber-100 text-amber-700'
          : 'bg-muted text-muted-foreground'
        }
      `}
    >
      <span>{achievement.icon}</span>
      <span>{achievement.name}</span>
    </div>
  );
}

// 포인트 표시 컴포넌트
export function PointsDisplay({ className = '' }: { className?: string }) {
  const { points, level } = useAchievements();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
        <span className="font-bold">Lv.{level}</span>
      </div>
      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
        <span className="text-amber-500">⭐</span>
        <span className="font-bold">{points.toLocaleString()}</span>
      </div>
    </div>
  );
}
