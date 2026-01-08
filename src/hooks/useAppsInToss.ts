/**
 * 앱인토스 통합 훅
 * 
 * 앱인토스 SDK의 핵심 기능들을 React 훅으로 쉽게 사용할 수 있습니다.
 * 햅틱 피드백, 스토리지, 공유하기, 플랫폼 정보 등을 제공합니다.
 * 
 * @example
 * function MyComponent() {
 *   const { 
 *     haptic,
 *     shareMessage,
 *     isAppsInToss,
 *     platform 
 *   } = useAppsInToss();
 *   
 *   const handleClick = () => {
 *     haptic('success');
 *     shareMessage({ message: '공유할 메시지' });
 *   };
 *   
 *   return (
 *     <button onClick={handleClick}>
 *       {isAppsInToss ? '토스에서 공유' : '공유하기'}
 *     </button>
 *   );
 * }
 */

import { useCallback, useMemo } from 'react';
import {
  haptic,
  HapticPresets,
  type HapticType,
} from '@/lib/appsintoss/haptic';
import {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorage,
  setStorageJSON,
  getStorageJSON,
} from '@/lib/appsintoss/storage';
import {
  shareMessage,
  shareInvite,
  shareScore,
  type ShareOptions,
} from '@/lib/appsintoss/share';
import {
  isAppsInToss,
  isSandbox,
  getPlatformOS,
  isDevelopment,
  getEnvironmentInfo,
} from '@/lib/appsintoss/platform';

/**
 * 앱인토스 통합 훅 반환 타입
 */
export interface UseAppsInTossReturn {
  // 플랫폼 정보
  /** 앱인토스 환경 여부 */
  isAppsInToss: boolean;
  /** 샌드박스(테스트) 환경 여부 */
  isSandbox: boolean;
  /** 현재 OS ('ios' | 'android' | 'unknown') */
  platform: ReturnType<typeof getPlatformOS>;
  /** 개발 모드 여부 */
  isDev: boolean;
  /** 환경 정보 전체 */
  environmentInfo: ReturnType<typeof getEnvironmentInfo>;

  // 햅틱 피드백
  /** 햅틱 피드백 실행 */
  haptic: (type?: HapticType) => Promise<void>;
  /** 햅틱 프리셋 */
  hapticPresets: typeof HapticPresets;

  // 스토리지
  /** 스토리지에 값 저장 */
  setStorage: typeof setStorageItem;
  /** 스토리지에서 값 읽기 */
  getStorage: typeof getStorageItem;
  /** 스토리지에서 값 삭제 */
  removeStorage: typeof removeStorageItem;
  /** 스토리지 전체 초기화 */
  clearStorage: typeof clearStorage;
  /** JSON 객체 저장 */
  setStorageJSON: typeof setStorageJSON;
  /** JSON 객체 읽기 */
  getStorageJSON: typeof getStorageJSON;

  // 공유하기
  /** 메시지 공유 */
  shareMessage: (options: ShareOptions) => Promise<void>;
  /** 앱 초대 공유 */
  shareInvite: (appName: string, deepLink?: string) => Promise<void>;
  /** 점수/결과 공유 */
  shareScore: typeof shareScore;
}

/**
 * 앱인토스 통합 훅
 * 
 * 앱인토스 SDK의 모든 핵심 기능을 하나의 훅에서 사용할 수 있습니다.
 */
export function useAppsInToss(): UseAppsInTossReturn {
  // 플랫폼 정보 (memoized)
  const platformInfo = useMemo(() => ({
    isAppsInToss: isAppsInToss(),
    isSandbox: isSandbox(),
    platform: getPlatformOS(),
    isDev: isDevelopment(),
    environmentInfo: getEnvironmentInfo(),
  }), []);

  // 햅틱 콜백
  const hapticCallback = useCallback(async (type: HapticType = 'tap') => {
    await haptic(type);
  }, []);

  // 공유하기 콜백
  const shareMessageCallback = useCallback(async (options: ShareOptions) => {
    await shareMessage(options);
  }, []);

  const shareInviteCallback = useCallback(async (appName: string, deepLink?: string) => {
    await shareInvite(appName, deepLink);
  }, []);

  return {
    // 플랫폼 정보
    ...platformInfo,

    // 햅틱 피드백
    haptic: hapticCallback,
    hapticPresets: HapticPresets,

    // 스토리지
    setStorage: setStorageItem,
    getStorage: getStorageItem,
    removeStorage: removeStorageItem,
    clearStorage,
    setStorageJSON,
    getStorageJSON,

    // 공유하기
    shareMessage: shareMessageCallback,
    shareInvite: shareInviteCallback,
    shareScore,
  };
}

export default useAppsInToss;
