/**
 * 앱인토스 타입 정의
 * 
 * 이 파일은 @apps-in-toss/web-framework의 타입이 없을 때를 대비한
 * 기본 타입 정의입니다. npm install 후에는 SDK의 타입이 우선됩니다.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 📱 앱인토스 SDK 타입 (대체용)
// ═══════════════════════════════════════════════════════════════════════════

declare module '@apps-in-toss/web-framework' {
  /**
   * 햅틱 피드백 타입
   */
  export type HapticFeedbackType =
    | 'tickWeak'
    | 'tap'
    | 'tickMedium'
    | 'softMedium'
    | 'basicWeak'
    | 'basicMedium'
    | 'success'
    | 'error'
    | 'wiggle'
    | 'confetti';

  export interface HapticFeedbackOptions {
    type: HapticFeedbackType;
  }

  /**
   * 햅틱 피드백 실행
   */
  export function generateHapticFeedback(options: HapticFeedbackOptions): Promise<void>;

  /**
   * 네이티브 스토리지
   */
  export const Storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clearItems(): Promise<void>;
  };

  /**
   * 공유하기
   */
  export function share(options: { message: string }): Promise<void>;

  /**
   * 플랫폼 OS 가져오기
   */
  export function getPlatformOS(): Promise<'ios' | 'android'>;

  /**
   * 네트워크 상태 가져오기
   */
  export function getNetworkStatus(): Promise<{
    isConnected: boolean;
    type: 'wifi' | 'cellular' | 'none' | 'unknown';
  }>;

  /**
   * 토스 로그인 (인가 코드 받기)
   */
  export function appLogin(options: {
    redirectUri: string;
    scope?: string[];
  }): Promise<{
    code: string;
    state?: string;
  }>;

  /**
   * 클립보드 텍스트 가져오기
   */
  export function getClipboardText(): Promise<string>;

  /**
   * 클립보드 텍스트 복사하기
   */
  export function setClipboardText(text: string): Promise<void>;

  /**
   * 로케일 가져오기
   */
  export function getLocale(): Promise<string>;
}

declare module '@apps-in-toss/web-framework/config' {
  export interface GraniteConfig {
    appName: string;
    brand?: {
      displayName?: string;
      primaryColor?: string;
      icon?: string;
      bridgeColorMode?: 'basic' | 'inverted';
    };
    web?: {
      host?: string;
      port?: number;
      commands?: {
        dev?: string;
        build?: string;
      };
    };
    permissions?: Array<'camera' | 'photo' | 'location' | 'contacts' | 'clipboard'>;
    outdir?: string;
    webViewProps?: {
      type?: 'partner' | 'game';
    };
  }

  export function defineConfig(config: GraniteConfig): GraniteConfig;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 Vite 환경 타입 확장
// ═══════════════════════════════════════════════════════════════════════════

interface ImportMetaEnv {
  readonly VITE_APP_MODE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEBUG?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🪟 Window 확장 (앱인토스 환경 감지용)
// ═══════════════════════════════════════════════════════════════════════════

interface Window {
  AppsInToss?: unknown;
  ReactNativeWebView?: {
    postMessage(message: string): void;
  };
}
