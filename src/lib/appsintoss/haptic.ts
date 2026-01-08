/**
 * 햅틱 피드백 유틸리티
 * 
 * 앱인토스 미니앱에서 네이티브 햅틱(진동) 피드백을 사용할 수 있습니다.
 * 버튼 터치, 화면 전환, 성공/에러 알림 등에 활용하세요.
 * 
 * ⚠️ 주의: 햅틱 피드백은 토스 앱 내에서만 동작합니다.
 *         로컬 브라우저에서는 동작하지 않습니다.
 * 
 * 📚 공식 문서: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/generateHapticFeedback.md
 */

import { isAppsInToss } from './platform';

/**
 * 햅틱 피드백 타입
 * 
 * - tickWeak: 가벼운 틱 (일반 터치)
 * - tap: 탭 (버튼 클릭)
 * - tickMedium: 중간 틱
 * - softMedium: 부드러운 중간 진동
 * - basicWeak: 기본 약한 진동
 * - basicMedium: 기본 중간 진동
 * - success: 성공 알림 (체크, 완료 등)
 * - error: 에러 알림 (실패, 경고 등)
 * - wiggle: 흔들기 (주의 환기)
 * - confetti: 축하 (이벤트, 보상 등)
 */
export type HapticType =
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

/**
 * 햅틱 피드백 실행
 * 
 * @param type 햅틱 타입 (기본값: 'tap')
 * @returns Promise<void>
 * 
 * @example
 * // 버튼 클릭 시
 * haptic('tap');
 * 
 * // 성공 알림
 * haptic('success');
 * 
 * // 에러 알림
 * haptic('error');
 */
export async function haptic(type: HapticType = 'tap'): Promise<void> {
  // 앱인토스 환경이 아니면 무시 (로컬 개발 시 에러 방지)
  if (!isAppsInToss()) {
    console.log(`[Haptic] ${type} - 앱인토스 환경에서만 동작합니다.`);
    return;
  }

  try {
    const { generateHapticFeedback } = await import('@apps-in-toss/web-framework');
    await generateHapticFeedback({ type });
  } catch (error) {
    console.warn('[Haptic] 햅틱 피드백 실행 실패:', error);
  }
}

/**
 * 미리 정의된 햅틱 프리셋
 * 자주 사용하는 햅틱 패턴을 간편하게 호출할 수 있습니다.
 */
export const HapticPresets = {
  /** 버튼 클릭 시 */
  click: () => haptic('tap'),
  
  /** 성공 시 (완료, 체크 등) */
  success: () => haptic('success'),
  
  /** 에러 시 (실패, 경고 등) */
  error: () => haptic('error'),
  
  /** 가벼운 터치 */
  light: () => haptic('tickWeak'),
  
  /** 중간 강도 터치 */
  medium: () => haptic('tickMedium'),
  
  /** 축하 이벤트 */
  celebrate: () => haptic('confetti'),
  
  /** 주의 환기 */
  warning: () => haptic('wiggle'),
};
