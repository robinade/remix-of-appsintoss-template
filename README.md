# 🚀 앱인토스 미니앱 템플릿

> **이 템플릿 하나로 앱인토스 출시까지!**  
> 토스 앱 내에서 실행되는 WebView 미니앱을 빠르게 개발하고 출시하세요.

[![앱인토스](https://img.shields.io/badge/Apps%20in%20Toss-3182F6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=&logoColor=white)](https://developers-apps-in-toss.toss.im/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📋 목차

- [🚀 앱인토스 미니앱 템플릿](#-앱인토스-미니앱-템플릿)
  - [📋 목차](#-목차)
  - [🎯 출시까지의 로드맵](#-출시까지의-로드맵)
  - [✨ 이 템플릿의 특징](#-이-템플릿의-특징)
  - [📦 빠른 시작 (5분 안에 개발 시작)](#-빠른-시작-5분-안에-개발-시작)
  - [🛤️ 출시 완전 가이드](#️-출시-완전-가이드)
    - [STEP 1: 설정 파일 수정](#step-1-설정-파일-수정)
    - [STEP 2: 앱 아이콘 준비](#step-2-앱-아이콘-준비)
    - [STEP 3: 앱인토스 콘솔 등록](#step-3-앱인토스-콘솔-등록)
    - [STEP 4: 사업자 등록 (수익화 필요 시)](#step-4-사업자-등록-수익화-필요-시)
    - [STEP 5: 출시 요청](#step-5-출시-요청)
  - [📁 프로젝트 구조](#-프로젝트-구조)
  - [🛠️ 주요 기능 사용법](#️-주요-기능-사용법)
  - [📱 실기기 테스트](#-실기기-테스트)
  - [🔧 스크립트 명령어](#-스크립트-명령어)
  - [⚠️ 출시 검토 시 주의사항](#️-출시-검토-시-주의사항)
  - [📚 공식 문서 링크](#-공식-문서-링크)

---

## 🎯 출시까지의 로드맵

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   📱 개발         🎨 브랜딩        📋 콘솔         📄 계약         🚀 출시   │
│                                                                             │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│   │  코드   │───▶│ 아이콘  │───▶│   앱    │───▶│ 사업자  │───▶│  검토   │  │
│   │  개발   │    │  제작   │    │  등록   │    │  등록   │    │  요청   │  │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                             │
│     1~2주          1~3일          1~2일          3~5일          1~2일       │
│                                                                             │
│                        ⏱️ 총 예상 소요 시간: 2~4주                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> 📋 **상세 체크리스트**: [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) 참고  
> 📖 **출시 완전 가이드**: [`PUBLISHING_GUIDE.md`](./PUBLISHING_GUIDE.md) - A to Z 완전 정리  
> ✅ **출시 전 점검**: [`CHECKLIST.md`](./CHECKLIST.md) - 체크박스 형식

---

## ✨ 이 템플릿의 특징

| 특징 | 설명 |
|------|------|
| 🎯 **인터랙티브 가이드** | 앱 자체가 출시 가이드! 실행하면서 배우세요 |
| 🚀 **즉시 시작** | 의존성 설치 후 바로 개발 가능 |
| 📋 **완전한 가이드** | 출시까지의 모든 과정 문서화 |
| 📱 **네이티브 기능** | 햅틱, 스토리지, 공유하기 등 SDK 내장 |
| 🎨 **토스 디자인** | TDS 기반 스타일 및 컴포넌트 |
| ✅ **가이드라인 준수** | 앱인토스 출시 기준 100% 충족 |
| 🔍 **출시 전 검증** | 자동 체크 스크립트 포함 |

### 🎮 앱 자체가 출시 가이드!

이 템플릿은 **단순한 예제가 아닙니다**. 앱을 실행하면:

- **📊 대시보드**: 현재 설정 상태와 진행률 실시간 확인
- **🗺️ 로드맵**: 5단계 출시 과정을 인터랙티브하게 탐색
- **✅ 체크리스트**: 자동 검증 + 수동 체크로 놓치는 것 없이!
- **📚 가이드**: 공식 문서 & 프로젝트 내 문서 바로가기

**개발자가 앱을 실행하면서 자연스럽게 출시 방법을 배울 수 있습니다.**

---

## 📦 빠른 시작 (5분 안에 개발 시작)

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 확인
# http://localhost:5173
```

---

## 🛤️ 출시 완전 가이드

### STEP 1: 설정 파일 수정

**1-1. `granite.config.ts` 수정 (필수)**

```typescript
// granite.config.ts
export default defineConfig({
  // ⚠️ 콘솔에서 등록할 앱 이름과 정확히 일치해야 함!
  appName: 'my-app-name',
  
  brand: {
    displayName: '나의 앱',           // 한글 앱 이름
    primaryColor: '#3182F6',         // 브랜드 컬러
    icon: 'https://cdn.example.com/icon-600x600.png',  // 아이콘 URL
  },
});
```

**1-2. `src/template.config.ts` 수정**

```typescript
// granite.config.ts와 동일한 값으로 설정
export const templateConfig = {
  appName: '나의 앱',                // displayName과 동일
  appId: 'my-app-name',             // appName과 동일
  theme: {
    primaryColor: '#3182F6',        // primaryColor와 동일
  },
  deepLink: {
    production: 'intoss://my-app-name',
    sandbox: 'intoss-private://my-app-name',
  },
};
```

---

### STEP 2: 앱 아이콘 준비

**필수 규격:**
- 📐 크기: **600x600px** (정사각형)
- 🖼️ 형식: **PNG** (투명 배경 불가)
- ⬛ 모서리: **각진 형태** (둥근 모서리 불가)
- 🌓 색상: 라이트/다크 모드 모두 잘 보이는 배경색

**아이콘 템플릿 다운로드:**
- 📥 [PDF 가이드](https://developers-apps-in-toss.toss.im/resources/prepare/logo_guide.pdf)

**아이콘 업로드:**
1. CDN에 업로드 (AWS S3, Cloudflare 등)
2. `granite.config.ts`의 `brand.icon`에 URL 입력
3. 앱인토스 콘솔에도 동일한 이미지 업로드

---

### STEP 3: 앱인토스 콘솔 등록

**콘솔 접속:** https://console-apps-in-toss.toss.im

| 순서 | 작업 | 설명 |
|:---:|------|------|
| 1 | 회원가입 | 토스 비즈니스 회원으로 가입 (만 19세 이상) |
| 2 | 워크스페이스 생성 | 팀/프로젝트 이름으로 생성 |
| 3 | 앱 등록 | '+등록하기' 클릭 |
| 4 | 기본 정보 입력 | 앱 로고, 앱 이름, appName 입력 |
| 5 | 검토 요청 | '검토 요청하기' 클릭 |

> ⚠️ **중요**: `appName`은 `granite.config.ts`의 값과 **정확히 일치**해야 합니다!

---

### STEP 4: 사업자 등록 (수익화 필요 시)

| 사업자 유형 | 수익화 | 토스 로그인 | 필요 서류 |
|------------|:------:|:----------:|----------|
| **사업자 있음** | ✅ | ✅ | 사업자등록증 + 대표자 신분증 |
| **사업자 없음** | ❌ | ❌ | 없음 (제한된 기능만 사용) |

**사업자 없이도 출시 가능!** 단, 결제/로그인 기능 사용 불가

**사업자 등록 신청:**
- 🔗 [국세청 홈택스](https://hometax.go.kr) (보통 3일 내 발급)

---

### STEP 5: 출시 요청

```bash
# 1. 프로덕션 빌드
npm run granite:build

# 2. .ait 파일 확인
ls dist/*.ait
```

**콘솔에서 출시:**
1. 앱 번들(.ait) 업로드
2. 버전 입력 (예: 1.0.0)
3. '검토 요청하기' 클릭
4. 검토 결과 대기 (영업일 1~2일)

**🎉 검토 통과 시 출시 완료!**

---

## 📁 프로젝트 구조

```
├── 📄 granite.config.ts        # ⭐ 앱인토스 핵심 설정 (필수 수정)
├── 📄 RELEASE_CHECKLIST.md     # ⭐ 출시 체크리스트 (필수 확인)
│
├── 📁 src/
│   ├── 📄 template.config.ts   # ⭐ 앱 테마/설정 (필수 수정)
│   ├── 📄 main.tsx             # 앱 진입점
│   ├── 📄 App.tsx              # 라우팅 설정
│   │
│   ├── 📁 features/
│   │   └── 📁 home/
│   │       └── 📄 HomeScreen.tsx  # ✏️ 여기서 개발 시작!
│   │
│   ├── 📁 hooks/
│   │   └── 📄 useAppsInToss.ts    # 앱인토스 SDK 통합 훅
│   │
│   └── 📁 components/
│       └── 📁 ui/                 # shadcn/ui 컴포넌트
│
├── 📄 index.html               # HTML (viewport 설정 완료)
└── 📄 package.json             # 의존성 및 스크립트
```

---

## 🛠️ 주요 기능 사용법

### 햅틱 피드백

```tsx
import { useAppsInToss } from '@/hooks/useAppsInToss';

function MyButton() {
  const { hapticPresets } = useAppsInToss();
  
  return (
    <button onClick={() => hapticPresets.click()}>
      버튼 클릭
    </button>
  );
}
```

### 공유하기

```tsx
const { shareMessage } = useAppsInToss();

await shareMessage({
  message: '친구에게 공유할 메시지! 🎉',
});
```

### 네이티브 스토리지

```tsx
const { setStorageJSON, getStorageJSON } = useAppsInToss();

// 저장
await setStorageJSON('user', { id: 1, name: 'Toss' });

// 읽기
const user = await getStorageJSON<User>('user');
```

### 플랫폼 감지

```tsx
const { isAppsInToss, isSandbox, platform } = useAppsInToss();
```

---

## 📱 실기기 테스트

### 샌드박스 앱 테스트

```bash
# 개발 서버 실행 (앱인토스 모드)
npm run granite:dev
```

### 실기기 연결 (Android)

```bash
# USB 연결 후
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173
```

### 네트워크 노출

```typescript
// granite.config.ts 수정
web: {
  host: '192.168.0.100',  // 실제 PC IP
  commands: {
    dev: 'vite --host',   // --host 추가
  },
},
```

---

## 🔧 스크립트 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 로컬 개발 서버 |
| `npm run dev:host` | 네트워크 노출 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run granite:dev` | 앱인토스 개발 모드 |
| `npm run granite:build` | 앱인토스 빌드 (.ait 생성) |
| `npm run check:publish` | 출시 준비 상태 자동 검증 |
| `npm run deploy` | 콘솔 배포 |

---

## ⚠️ 출시 검토 시 주의사항

### 반려되는 주요 사유

| 사유 | 해결 방법 |
|------|----------|
| ❌ 커스텀 헤더 사용 | 앱인토스 네비게이션 바 사용 |
| ❌ appName 불일치 | granite.config.ts와 콘솔 일치 확인 |
| ❌ 터치 영역 부족 | 모든 버튼 44px 이상 |
| ❌ 외부 링크 존재 | 자사 앱/웹 유도 버튼 제거 |
| ❌ 다크모드 사용 | 라이트 모드만 지원 |
| ❌ 응답 2초 초과 | 성능 최적화 필요 |

### 이 템플릿은 이미 준수 완료

- ✅ 라이트 모드만 사용
- ✅ 핀치줌 비활성화 (`index.html`)
- ✅ 커스텀 헤더 없음
- ✅ 터치 영역 44px+ 확보
- ✅ 네이티브 스토리지 사용
- ✅ 외부 링크 없음

---

## 📚 공식 문서 링크

| 문서 | 설명 |
|------|------|
| [개발자 센터](https://developers-apps-in-toss.toss.im/) | 메인 문서 |
| [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame.md) | 출시 체크리스트 |
| [브랜딩 가이드](https://developers-apps-in-toss.toss.im/design/miniapp-branding-guide.md) | 디자인 가이드 |
| [콘솔 등록](https://developers-apps-in-toss.toss.im/prepare/console-workspace.md) | 콘솔 사용법 |
| [사업자 등록](https://developers-apps-in-toss.toss.im/prepare/register-business.md) | 사업자 등록 |
| [예제 코드](https://developers-apps-in-toss.toss.im/tutorials/examples.md) | 기능별 예제 |

---

## 💬 도움이 필요하면?

- **기술 문의**: 앱인토스 개발자 센터 FAQ
- **사업 문의**: 앱인토스 콘솔 내 문의하기

---

> Made with ❤️ for Apps in Toss
