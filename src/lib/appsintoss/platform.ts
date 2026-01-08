/**
 * 플랫폼 감지 유틸리티
 * 
 * 현재 실행 환경을 감지하여 앱인토스 환경 여부,
 * 샌드박스 환경 여부, OS 종류 등을 확인할 수 있습니다.
 * 
 * 📚 공식 문서: https://developers-apps-in-toss.toss.im/
 */

/**
 * 앱인토스 환경인지 확인
 * 
 * 토스 앱 내에서 실행되는지 확인합니다.
 * 로컬 브라우저에서 개발 중이면 false를 반환합니다.
 * 
 * @returns true: 토스 앱 내, false: 일반 브라우저
 * 
 * @example
 * if (isAppsInToss()) {
 *   // 앱인토스 전용 기능 사용
 *   haptic('success');
 * } else {
 *   // 브라우저 대체 기능 사용
 *   console.log('Success!');
 * }
 */
export function isAppsInToss(): boolean {
  if (typeof window === 'undefined') return false;
  
  // User Agent에서 토스 앱 확인
  const ua = navigator.userAgent.toLowerCase();
  const isTossApp = ua.includes('toss') || ua.includes('intoss');
  
  // 앱인토스 전용 객체 확인
  const hasAppsInToss = !!(window as unknown as { AppsInToss?: unknown }).AppsInToss;
  
  // ReactNativeWebView 확인 (React Native 기반 앱인토스)
  const hasReactNativeWebView = !!(window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  
  return isTossApp || hasAppsInToss || hasReactNativeWebView;
}

/**
 * 샌드박스(테스트) 환경인지 확인
 * 
 * 앱인토스 샌드박스 앱에서 실행되는지 확인합니다.
 * 개발 및 테스트 시 유용합니다.
 * 
 * @returns true: 샌드박스 환경, false: 프로덕션 또는 브라우저
 */
export function isSandbox(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('sandbox') || ua.includes('intoss-private');
}

/**
 * 현재 OS 확인
 * 
 * @returns 'ios' | 'android' | 'unknown'
 */
export function getPlatformOS(): 'ios' | 'android' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  
  return 'unknown';
}

/**
 * 개발 모드인지 확인
 * 
 * Vite의 개발 서버에서 실행 중인지 확인합니다.
 * 
 * @returns true: 개발 모드, false: 프로덕션
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * 프로덕션 모드인지 확인
 * 
 * @returns true: 프로덕션, false: 개발 모드
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * 환경 정보 요약
 * 
 * 디버깅용으로 현재 환경 정보를 객체로 반환합니다.
 * 
 * @example
 * console.log(getEnvironmentInfo());
 * // { isAppsInToss: true, isSandbox: false, os: 'ios', isDev: false }
 */
export function getEnvironmentInfo() {
  return {
    isAppsInToss: isAppsInToss(),
    isSandbox: isSandbox(),
    os: getPlatformOS(),
    isDev: isDevelopment(),
    isProd: isProduction(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
  };
}
