/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 앱인토스 미니앱 템플릿 설정 (template.config.ts)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 이 파일은 앱 내부에서 사용하는 설정입니다.
 * 
 * ⚠️ 중요: granite.config.ts의 설정과 반드시 일치시켜야 합니다!
 * 
 * 📚 앱인토스 브랜딩 가이드: 
 *    https://developers-apps-in-toss.toss.im/design/miniapp-branding-guide.md
 * 📋 출시 체크리스트: 프로젝트 루트의 RELEASE_CHECKLIST.md 참고
 */

export const templateConfig = {
  // ═══════════════════════════════════════════════════════════════════════
  // 🏷️ 앱 기본 정보 (출시 필수 설정)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 앱 이름 (한글)
   * granite.config.ts의 brand.displayName과 동일해야 합니다.
   * 
   * @example '출시 가이드' | '쇼핑몰' | '퍼즐 게임'
   */
  appName: '눈 건강 마스터', // ✅ granite.config.ts의 displayName과 동기화됨
  
  /**
   * 앱 ID (영문, 소문자, 하이픈)
   * granite.config.ts의 appName과 **정확히 동일**해야 합니다!
   * 딥링크 주소: intoss://{appId}
   * 
   * @example 'todo-app' | 'shopping-mall' | 'puzzle-game'
   */
  appId: 'eyemaster', // ✅ granite.config.ts의 appName과 동기화됨
  
  /**
   * 앱 버전
   * 출시 시 콘솔에서 입력하는 버전과 동일하게 관리하세요.
   */
  version: '1.0.0',
  
  /**
   * 앱 설명 (선택)
   * 앱 내에서 사용할 수 있는 설명 문구입니다.
   */
  description: 'AI 기반 눈 건강 관리 앱 - 시력 테스트, 색약 검사, 난시 검사, 20-20-20 타이머, 눈 운동', // ✅ 앱 설명 업데이트

  // ═══════════════════════════════════════════════════════════════════════
  // 🎨 테마 설정 (출시 필수 설정)
  // ═══════════════════════════════════════════════════════════════════════
  
  theme: {
    /**
     * 브랜드 컬러 (HEX 형식)
     * granite.config.ts의 brand.primaryColor와 **동일**해야 합니다!
     * 
     * 💡 브랜드 컬러가 없다면 로고에서 가장 많이 쓰인 색상 사용
     * 컬러 추출: https://lokeshdhakar.com/projects/color-thief/
     * 
     * @example '#3182F6' (토스 블루) | '#00C471' (그린)
     */
    primaryColor: '#3182F6', // ✅ granite.config.ts의 primaryColor와 동기화됨
    
    // ───────────────────────────────────────────────────────────────────
    // 📝 아래 색상들은 토스 디자인 시스템(TDS) 기본값입니다.
    // 특별한 이유가 없다면 변경하지 않는 것을 권장합니다.
    // ───────────────────────────────────────────────────────────────────
    
    /**
     * 배경색
     * ⚠️ 앱인토스는 라이트 모드만 지원합니다. 다크모드 배경색 사용 금지!
     */
    backgroundColor: '#FFFFFF',
    
    /** 주요 텍스트 색상 */
    textColor: '#191F28',
    
    /** 보조 텍스트 색상 */
    secondaryTextColor: '#8B95A1',
    
    /** 비활성화 색상 */
    disabledColor: '#DADEE2',
    
    /** 성공 색상 */
    successColor: '#00C471',
    
    /** 에러 색상 */
    errorColor: '#F04452',
    
    /** 경고 색상 */
    warningColor: '#FFC043',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🔐 권한 설정 (UI 표시용)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 앱에서 사용할 권한 (UI 표시용)
   * 
   * ⚠️ 실제 권한은 granite.config.ts의 permissions에서 설정합니다!
   * 여기서는 앱 내 UI에서 권한 상태를 표시하는 용도로만 사용됩니다.
   */
  permissions: {
    camera: true,       // ✅ 카메라 - 거리 측정에서 사용
    photo: false,       // 사진 앨범
    location: false,    // 위치 정보
    contacts: false,    // 연락처
    clipboard: false,   // 클립보드
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🧭 네비게이션 설정
  // ═══════════════════════════════════════════════════════════════════════
  
  navigation: {
    /**
     * 시작 라우트
     */
    initialRoute: 'home',
    
    /**
     * 헤더 표시 여부
     * 
     * ⚠️ 주의: 앱인토스는 네비게이션 바를 자동 제공합니다!
     * 커스텀 헤더를 사용하면 출시 검토에서 반려됩니다.
     */
    headerVisible: true,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🔗 딥링크 설정
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 딥링크 기본 URL
   * 공유하기 등에서 사용됩니다.
   * 
   * ⚠️ appId 부분을 실제 앱 ID로 변경하세요!
   */
  deepLink: {
    /** 프로덕션 딥링크 */
    production: 'intoss://eyemaster', // ✅ 실제 appId로 설정됨
    /** 테스트(샌드박스) 딥링크 */
    sandbox: 'intoss-private://eyemaster', // ✅ 실제 appId로 설정됨
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 📋 설정 일치 확인 체크리스트
// ═══════════════════════════════════════════════════════════════════════════
/**
 * granite.config.ts와 이 파일의 설정이 일치하는지 확인하세요:
 * 
 * [ ] appId === granite.config.ts의 appName
 * [ ] appName === granite.config.ts의 brand.displayName
 * [ ] theme.primaryColor === granite.config.ts의 brand.primaryColor
 * [ ] deepLink의 appId 부분이 실제 앱 ID와 일치
 */

// 타입 추출
export type TemplateConfig = typeof templateConfig;
export type ThemeConfig = typeof templateConfig.theme;
export type PermissionsConfig = typeof templateConfig.permissions;
