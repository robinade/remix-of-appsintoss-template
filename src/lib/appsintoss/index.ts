/**
 * 앱인토스 SDK 유틸리티 모듈
 * 
 * 이 파일은 @apps-in-toss/web-framework의 핵심 기능들을
 * 초보자도 쉽게 사용할 수 있도록 래핑한 유틸리티 함수들입니다.
 * 
 * 📚 공식 문서: https://developers-apps-in-toss.toss.im/
 */

// 개별 유틸리티 모듈들을 re-export
export * from './haptic';
export * from './storage';
export * from './share';
export * from './platform';

// 앱인토스 환경 감지
export { isAppsInToss, isSandbox } from './platform';
