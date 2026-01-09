/**
 * 앱인토스 출시 가이드 - 메인 대시보드
 * 
 * 이 화면 자체가 "출시 가이드 앱"입니다.
 * 개발자가 이 앱을 실행하면서 출시 방법을 자연스럽게 배울 수 있습니다.
 * 
 * ⚠️ 중요 - 앱인토스 네비게이션 바 가이드라인:
 * - 앱인토스가 네비게이션 바를 자동으로 제공합니다
 * - 커스텀 헤더를 만들지 마세요 (출시 검토에서 반려됨)
 */

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Rocket,
  Palette,
  FileText,
  Building2,
  Zap,
  BookOpen,
  Settings,
  Image,
  Link2,
} from 'lucide-react';
import { templateConfig } from '@/template.config';
import { Button } from '@/components/ui/button';
import { useAppsInToss } from '@/hooks/useAppsInToss';

// ═══════════════════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════════════════

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  status: 'completed' | 'current' | 'pending';
  details: string[];
}

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
  type: 'auto' | 'manual';
  status?: 'pass' | 'warn' | 'error';
  detail?: string;
}

interface GuideLink {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}

interface HomeScreenProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5단계 출시 로드맵 데이터
// ═══════════════════════════════════════════════════════════════════════════

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 1,
    title: '개발',
    description: '기능 개발 및 테스트',
    icon: <Zap className="h-5 w-5" />,
    duration: '1~2주',
    status: 'current',
    details: [
      'src/features/home/HomeScreen.tsx에서 개발 시작',
      'useAppsInToss 훅으로 네이티브 기능 사용',
      'npm run dev로 로컬 테스트',
      'npm run granite:dev로 샌드박스 테스트',
    ],
  },
  {
    id: 2,
    title: '브랜딩',
    description: '아이콘 & 컬러 설정',
    icon: <Palette className="h-5 w-5" />,
    duration: '1~3일',
    status: 'pending',
    details: [
      '600x600px 앱 아이콘 제작',
      'granite.config.ts에 icon URL 입력',
      'primaryColor 브랜드 컬러 설정',
      'displayName 앱 이름 설정',
    ],
  },
  {
    id: 3,
    title: '콘솔 등록',
    description: '앱인토스 콘솔에 앱 등록',
    icon: <FileText className="h-5 w-5" />,
    duration: '1~2일',
    status: 'pending',
    details: [
      'console-apps-in-toss.toss.im 접속',
      '워크스페이스 생성',
      'appName과 동일한 이름으로 앱 등록',
      '앱 정보 검토 요청',
    ],
  },
  {
    id: 4,
    title: '사업자 등록',
    description: '수익화 필요 시 등록',
    icon: <Building2 className="h-5 w-5" />,
    duration: '3~5일',
    status: 'pending',
    details: [
      '사업자 없이도 출시 가능 (제한된 기능)',
      '수익화/토스 로그인 필요 시 사업자 등록',
      '대표관리자 신청 및 승인 필요',
      '국세청 홈택스에서 3일 내 발급',
    ],
  },
  {
    id: 5,
    title: '출시',
    description: '검토 요청 및 배포',
    icon: <Rocket className="h-5 w-5" />,
    duration: '1~2일',
    status: 'pending',
    details: [
      'npm run granite:build로 .ait 파일 생성',
      '콘솔에서 앱 번들 업로드',
      '검토 요청하기 클릭',
      '영업일 1~2일 내 검토 결과',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 가이드 링크 데이터
// ═══════════════════════════════════════════════════════════════════════════

const GUIDE_LINKS: GuideLink[] = [
  {
    title: '개발자 센터',
    description: '공식 문서 & API 레퍼런스',
    url: 'https://developers-apps-in-toss.toss.im/',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: '출시 체크리스트',
    description: '비게임 앱 출시 기준',
    url: 'https://developers-apps-in-toss.toss.im/checklist/app-nongame.md',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    title: '앱인토스 콘솔',
    description: '앱 등록 & 관리',
    url: 'https://console-apps-in-toss.toss.im',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: '브랜딩 가이드',
    description: '아이콘 & 디자인 규격',
    url: 'https://developers-apps-in-toss.toss.im/design/miniapp-branding-guide.md',
    icon: <Palette className="h-5 w-5" />,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

export function HomeScreen({ onShowToast }: HomeScreenProps) {
  const { 
    haptic, 
    hapticPresets,
    setStorageJSON, 
    getStorageJSON,
  } = useAppsInToss();

  // 체크리스트 상태 (수동 체크 항목만 저장)
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [currentTab, setCurrentTab] = useState<'roadmap' | 'checklist' | 'guides'>('roadmap');

  // 저장된 체크 상태 불러오기
  useEffect(() => {
    const loadChecks = async () => {
      const saved = await getStorageJSON<Record<string, boolean>>('manual-checks');
      if (saved) {
        setManualChecks(saved);
      }
      setIsLoaded(true);
    };
    loadChecks();
  }, [getStorageJSON]);

  // 체크 상태 변경 시 저장
  useEffect(() => {
    if (isLoaded) {
      setStorageJSON('manual-checks', manualChecks);
    }
  }, [manualChecks, isLoaded, setStorageJSON]);

  // ─────────────────────────────────────────────────────────────────────────
  // 자동 검증 체크리스트 (현재 설정 상태 기반)
  // ─────────────────────────────────────────────────────────────────────────
  
  const autoCheckItems: CheckItem[] = [
    {
      id: 'light-only',
      label: '라이트모드 전용',
      checked: true, // 템플릿 기본값
      type: 'auto',
      status: 'pass',
      detail: '앱인토스는 라이트모드만 지원',
    },
    {
      id: 'header',
      label: '커스텀 헤더 없음',
      checked: true,
      type: 'auto',
      status: 'pass',
      detail: '앱인토스 네비게이션 바 자동 제공',
    },
    {
      id: 'viewport',
      label: 'viewport 설정 완료',
      checked: true,
      type: 'auto',
      status: 'pass',
      detail: 'user-scalable=no, viewport-fit=cover',
    },
    {
      id: 'touch',
      label: '터치 영역 44px 이상',
      checked: true,
      type: 'auto',
      status: 'pass',
      detail: '모든 버튼/체크박스 접근성 준수',
    },
    {
      id: 'icon',
      label: '앱 아이콘 설정',
      checked: false, // TODO: granite.config.ts에서 동적 체크
      type: 'auto',
      status: 'error',
      detail: 'granite.config.ts의 brand.icon 필요',
    },
    {
      id: 'appname',
      label: 'appName 변경',
      checked: templateConfig.appId !== 'todo-app',
      type: 'auto',
      status: templateConfig.appId === 'todo-app' ? 'warn' : 'pass',
      detail: templateConfig.appId === 'todo-app' 
        ? '기본값 "todo-app" → 실제 앱 이름으로 변경 필요' 
        : `현재: "${templateConfig.appId}"`,
    },
  ];

  // 수동 체크리스트
  const manualCheckItems: CheckItem[] = [
    {
      id: 'console-register',
      label: '앱인토스 콘솔에 앱 등록',
      checked: manualChecks['console-register'] || false,
      type: 'manual',
    },
    {
      id: 'console-appname',
      label: '콘솔 appName과 granite.config.ts 일치 확인',
      checked: manualChecks['console-appname'] || false,
      type: 'manual',
    },
    {
      id: 'icon-upload',
      label: '600x600px 아이콘 업로드',
      checked: manualChecks['icon-upload'] || false,
      type: 'manual',
    },
    {
      id: 'business-register',
      label: '사업자 등록 (수익화 시 필수)',
      checked: manualChecks['business-register'] || false,
      type: 'manual',
    },
    {
      id: 'review-request',
      label: '앱 정보 검토 요청',
      checked: manualChecks['review-request'] || false,
      type: 'manual',
    },
  ];

  // 진행률 계산
  const allChecks = [...autoCheckItems, ...manualCheckItems];
  const completedChecks = allChecks.filter(item => item.checked).length;
  const progressPercent = Math.round((completedChecks / allChecks.length) * 100);

  // 수동 체크 토글
  const handleManualCheck = async (id: string) => {
    await haptic('tap');
    setManualChecks(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    if (!manualChecks[id]) {
      onShowToast?.('체크 완료!', 'success');
    }
  };

  // 로드맵 단계 토글
  const handleStepToggle = async (stepId: number) => {
    await hapticPresets.click();
    setExpandedStep(prev => prev === stepId ? null : stepId);
  };

  // 외부 링크 열기
  const handleOpenLink = async (url: string) => {
    await haptic('tap');
    window.open(url, '_blank');
  };

  // 탭 변경
  const handleTabChange = async (tab: typeof currentTab) => {
    await haptic('tap');
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="flex flex-col px-5 pb-8 pt-4">
        
        {/* ═══════════════════════════════════════════════════════════════════
         * 📊 출시 준비 현황 카드
         * ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-6">
          <div 
            className="rounded-2xl p-5"
            style={{ backgroundColor: `${templateConfig.theme.primaryColor}10` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">출시 준비 현황</p>
                <p className="text-2xl font-bold" style={{ color: templateConfig.theme.primaryColor }}>
                  {completedChecks} / {allChecks.length}
                </p>
              </div>
              <div 
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: templateConfig.theme.primaryColor }}
              >
                <Rocket className="h-7 w-7 text-white" />
              </div>
            </div>
            
            {/* 프로그레스 바 */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: templateConfig.theme.primaryColor,
                }}
              />
            </div>
            <p className="mt-2 text-right text-sm text-gray-500">
              {progressPercent}% 완료
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
         * 🔧 설정 상태 요약
         * ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">현재 설정 상태</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 아이콘 상태 */}
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Image className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-600">아이콘</p>
                <p className="truncate text-sm font-medium text-red-700">미설정</p>
              </div>
            </div>
            
            {/* appName 상태 */}
            <div className={`flex items-center gap-3 rounded-xl border p-3 ${
              templateConfig.appId === 'todo-app' 
                ? 'border-yellow-200 bg-yellow-50' 
                : 'border-green-200 bg-green-50'
            }`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                templateConfig.appId === 'todo-app' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <Link2 className={`h-5 w-5 ${
                  templateConfig.appId === 'todo-app' ? 'text-yellow-600' : 'text-green-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${
                  templateConfig.appId === 'todo-app' ? 'text-yellow-600' : 'text-green-600'
                }`}>appName</p>
                <p className={`truncate text-sm font-medium ${
                  templateConfig.appId === 'todo-app' ? 'text-yellow-700' : 'text-green-700'
                }`}>{templateConfig.appId}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
         * 📑 탭 네비게이션
         * ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-4">
          <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
            {[
              { id: 'roadmap' as const, label: '로드맵', icon: <Rocket className="h-4 w-4" /> },
              { id: 'checklist' as const, label: '체크리스트', icon: <CheckCircle2 className="h-4 w-4" /> },
              { id: 'guides' as const, label: '가이드', icon: <BookOpen className="h-4 w-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  currentTab === tab.id 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500'
                }`}
                style={{ minHeight: '44px' }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
         * 🗺️ 탭 콘텐츠
         * ═══════════════════════════════════════════════════════════════════ */}
        
        {/* 로드맵 탭 */}
        {currentTab === 'roadmap' && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">🚀 5단계 출시 로드맵</h2>
            <p className="text-sm text-gray-500">총 예상 소요 시간: 2~4주</p>
            
            {ROADMAP_STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`overflow-hidden rounded-xl border transition-all ${
                  step.status === 'current' 
                    ? 'border-blue-200 bg-blue-50' 
                    : step.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* 단계 헤더 */}
                <button
                  onClick={() => handleStepToggle(step.id)}
                  className="flex w-full items-center gap-3 p-4"
                  style={{ minHeight: '56px' }}
                >
                  {/* 단계 번호 */}
                  <div 
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      step.status === 'current' 
                        ? 'bg-blue-500 text-white' 
                        : step.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  {/* 단계 정보 */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {step.id}. {step.title}
                      </span>
                      {step.status === 'current' && (
                        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                          현재
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  
                  {/* 소요 시간 & 화살표 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{step.duration}</span>
                    <ChevronRight 
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedStep === step.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>
                
                {/* 상세 내용 */}
                {expandedStep === step.id && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 연결선 */}
                {index < ROADMAP_STEPS.length - 1 && (
                  <div className="mx-7 h-4 w-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </section>
        )}
        
        {/* 체크리스트 탭 */}
        {currentTab === 'checklist' && (
          <section className="space-y-4">
            {/* 자동 검증 항목 */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
                <Zap className="h-4 w-4" />
                자동 검증 (템플릿 기본 설정)
              </h3>
              <ul className="space-y-2">
                {autoCheckItems.map(item => (
                  <li 
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      item.status === 'pass' 
                        ? 'border-green-200 bg-green-50' 
                        : item.status === 'warn'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : item.status === 'warn' ? (
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        item.status === 'pass' 
                          ? 'text-green-700' 
                          : item.status === 'warn'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>{item.label}</p>
                      {item.detail && (
                        <p className={`text-xs ${
                          item.status === 'pass' 
                            ? 'text-green-600' 
                            : item.status === 'warn'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>{item.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 수동 체크 항목 */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
                <CheckCircle2 className="h-4 w-4" />
                수동 체크 (직접 완료 확인)
              </h3>
              <ul className="space-y-2">
                {manualCheckItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleManualCheck(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all ${
                        item.checked 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                      style={{ minHeight: '52px' }}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 flex-shrink-0 text-gray-300" />
                      )}
                      <span className={`text-sm font-medium ${
                        item.checked ? 'text-green-700' : 'text-gray-700'
                      }`}>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
        
        {/* 가이드 탭 */}
        {currentTab === 'guides' && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">📚 공식 가이드</h2>
            
            {GUIDE_LINKS.map(link => (
              <button
                key={link.url}
                onClick={() => handleOpenLink(link.url)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
                style={{ minHeight: '72px' }}
              >
                <div 
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${templateConfig.theme.primaryColor}15` }}
                >
                  <span style={{ color: templateConfig.theme.primaryColor }}>{link.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{link.title}</p>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </div>
                <ExternalLink className="h-5 w-5 flex-shrink-0 text-gray-400" />
              </button>
            ))}
            
            {/* 프로젝트 내 문서 */}
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-500">📁 프로젝트 내 문서</h3>
              <div className="rounded-xl bg-gray-50 p-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">RELEASE_CHECKLIST.md</code>
                    <span>- 출시 체크리스트</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">granite.config.ts</code>
                    <span>- 앱 핵심 설정</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">docs/CONSOLE_GUIDE.md</code>
                    <span>- 콘솔 등록 가이드</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">docs/APP_ICON_GUIDE.md</code>
                    <span>- 아이콘 제작 가이드</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
         * 📌 개발자 정보 (프로덕션에서는 제거하세요)
         * ═══════════════════════════════════════════════════════════════════ */}
        {import.meta.env.DEV && (
          <section className="mt-8 rounded-xl bg-blue-50 p-4 text-sm">
            <p className="mb-2 font-semibold text-blue-800">💡 개발자 팁</p>
            <p className="text-blue-700">
              이 화면은 <strong>앱인토스 출시 가이드 앱</strong>입니다.<br/>
              실제 앱 개발 시 이 코드를 참고하여 수정하세요.
            </p>
            <div className="mt-3 space-y-1 text-xs text-blue-600">
              <p>• <code>src/features/home/HomeScreen.tsx</code>를 수정하여 개발 시작</p>
              <p>• <code>useAppsInToss</code> 훅으로 네이티브 기능 사용</p>
              <p>• <code>granite.config.ts</code>에서 앱 설정 변경</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
