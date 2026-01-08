/**
 * 네이티브 스토리지 유틸리티
 * 
 * 앱인토스 미니앱에서 네이티브 로컬 스토리지를 사용할 수 있습니다.
 * 앱이 종료되어도 데이터가 유지됩니다.
 * 
 * ⚠️ 주의: 
 *    - 토스 앱 내에서만 동작합니다.
 *    - 로컬 브라우저에서는 localStorage를 대신 사용합니다.
 *    - 문자열만 저장 가능합니다 (객체는 JSON.stringify 필요)
 * 
 * 📚 공식 문서: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/Storage.md
 */

import { isAppsInToss } from './platform';

/**
 * 스토리지에 값 저장
 * 
 * @param key 저장할 키
 * @param value 저장할 값 (문자열)
 * 
 * @example
 * // 문자열 저장
 * await setStorageItem('username', 'toss_user');
 * 
 * // 객체 저장 (JSON 변환)
 * await setStorageItem('user', JSON.stringify({ id: 1, name: 'Toss' }));
 */
export async function setStorageItem(key: string, value: string): Promise<void> {
  if (!isAppsInToss()) {
    // 로컬 개발 시 localStorage 사용
    localStorage.setItem(key, value);
    console.log(`[Storage] 로컬 저장: ${key}`);
    return;
  }

  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.setItem(key, value);
  } catch (error) {
    console.warn('[Storage] 저장 실패, localStorage로 폴백:', error);
    localStorage.setItem(key, value);
  }
}

/**
 * 스토리지에서 값 읽기
 * 
 * @param key 읽을 키
 * @returns 저장된 값 또는 null
 * 
 * @example
 * // 문자열 읽기
 * const username = await getStorageItem('username');
 * 
 * // 객체 읽기 (JSON 파싱)
 * const userStr = await getStorageItem('user');
 * const user = userStr ? JSON.parse(userStr) : null;
 */
export async function getStorageItem(key: string): Promise<string | null> {
  if (!isAppsInToss()) {
    // 로컬 개발 시 localStorage 사용
    const value = localStorage.getItem(key);
    console.log(`[Storage] 로컬 읽기: ${key} = ${value}`);
    return value;
  }

  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    return await Storage.getItem(key);
  } catch (error) {
    console.warn('[Storage] 읽기 실패, localStorage로 폴백:', error);
    return localStorage.getItem(key);
  }
}

/**
 * 스토리지에서 값 삭제
 * 
 * @param key 삭제할 키
 * 
 * @example
 * await removeStorageItem('username');
 */
export async function removeStorageItem(key: string): Promise<void> {
  if (!isAppsInToss()) {
    localStorage.removeItem(key);
    console.log(`[Storage] 로컬 삭제: ${key}`);
    return;
  }

  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.removeItem(key);
  } catch (error) {
    console.warn('[Storage] 삭제 실패, localStorage로 폴백:', error);
    localStorage.removeItem(key);
  }
}

/**
 * 스토리지 전체 초기화
 * 
 * ⚠️ 주의: 모든 저장된 데이터가 삭제됩니다!
 * 
 * @example
 * await clearStorage();
 */
export async function clearStorage(): Promise<void> {
  if (!isAppsInToss()) {
    localStorage.clear();
    console.log('[Storage] 로컬 스토리지 초기화');
    return;
  }

  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.clearItems();
  } catch (error) {
    console.warn('[Storage] 초기화 실패, localStorage로 폴백:', error);
    localStorage.clear();
  }
}

/**
 * JSON 객체를 스토리지에 저장
 * 자동으로 JSON.stringify를 수행합니다.
 * 
 * @param key 저장할 키
 * @param value 저장할 객체
 * 
 * @example
 * await setStorageJSON('user', { id: 1, name: 'Toss', level: 10 });
 */
export async function setStorageJSON<T>(key: string, value: T): Promise<void> {
  await setStorageItem(key, JSON.stringify(value));
}

/**
 * 스토리지에서 JSON 객체 읽기
 * 자동으로 JSON.parse를 수행합니다.
 * 
 * @param key 읽을 키
 * @returns 파싱된 객체 또는 null
 * 
 * @example
 * const user = await getStorageJSON<User>('user');
 * if (user) {
 *   console.log(user.name);
 * }
 */
export async function getStorageJSON<T>(key: string): Promise<T | null> {
  const value = await getStorageItem(key);
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    console.warn(`[Storage] JSON 파싱 실패: ${key}`);
    return null;
  }
}
