/**
 * 공유하기 유틸리티
 * 
 * 앱인토스 미니앱에서 네이티브 공유 시트를 열어
 * 다른 앱으로 콘텐츠를 공유할 수 있습니다.
 * 
 * ⚠️ 주의: 토스 앱 내에서만 동작합니다.
 *         로컬 브라우저에서는 Web Share API를 대신 사용합니다.
 * 
 * 📚 공식 문서: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/share.md
 */

import { isAppsInToss } from './platform';

/**
 * 공유 옵션
 */
export interface ShareOptions {
  /** 공유할 메시지 (필수) */
  message: string;
  /** 공유 제목 (선택, Web Share API에서 사용) */
  title?: string;
  /** 공유 URL (선택, Web Share API에서 사용) */
  url?: string;
}

/**
 * 메시지 공유하기
 * 
 * 네이티브 공유 시트를 열어 사용자가 원하는 앱으로
 * 메시지를 공유할 수 있습니다.
 * 
 * @param options 공유 옵션
 * @returns Promise<void>
 * 
 * @example
 * // 기본 공유
 * await shareMessage({ message: '친구에게 공유할 메시지입니다!' });
 * 
 * // 초대 링크 공유
 * await shareMessage({ 
 *   message: '나의 미니앱에 초대합니다! 지금 바로 확인해보세요.',
 *   url: 'intoss://my-miniapp'
 * });
 */
export async function shareMessage(options: ShareOptions): Promise<void> {
  const { message, title, url } = options;

  if (!isAppsInToss()) {
    // 로컬 개발 시 Web Share API 사용 시도
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || '공유하기',
          text: message,
          url: url,
        });
        console.log('[Share] Web Share API로 공유 완료');
        return;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('[Share] Web Share API 실패:', error);
        }
        return;
      }
    } else {
      // Web Share API 미지원 시 클립보드 복사
      try {
        await navigator.clipboard.writeText(message);
        console.log('[Share] 클립보드에 복사됨 (Web Share API 미지원)');
        alert('클립보드에 복사되었습니다!\n(앱인토스 환경에서는 공유 시트가 열립니다)');
      } catch {
        console.warn('[Share] 클립보드 복사 실패');
      }
      return;
    }
  }

  try {
    const { share } = await import('@apps-in-toss/web-framework');
    await share({ message });
  } catch (error) {
    console.warn('[Share] 공유 실패:', error);
    throw error;
  }
}

/**
 * 앱 초대 메시지 공유
 * 미리 작성된 초대 메시지 템플릿을 사용합니다.
 * 
 * @param appName 앱 이름
 * @param deepLink 딥링크 URL (선택)
 * 
 * @example
 * await shareInvite('나의 미니앱', 'intoss://my-miniapp');
 */
export async function shareInvite(appName: string, deepLink?: string): Promise<void> {
  let message = `${appName}에 초대합니다! 지금 바로 확인해보세요.`;
  
  if (deepLink) {
    message += `\n\n${deepLink}`;
  }

  await shareMessage({ message });
}

/**
 * 결과/점수 공유
 * 게임 결과나 점수를 공유할 때 사용합니다.
 * 
 * @param title 제목 (예: "오늘의 퀴즈 결과")
 * @param score 점수
 * @param maxScore 최대 점수 (선택)
 * @param deepLink 딥링크 URL (선택)
 * 
 * @example
 * await shareScore('오늘의 퀴즈 결과', 85, 100);
 */
export async function shareScore(
  title: string,
  score: number,
  maxScore?: number,
  deepLink?: string
): Promise<void> {
  let message = `${title}\n`;
  
  if (maxScore) {
    message += `${score}/${maxScore}점을 달성했어요!`;
  } else {
    message += `${score}점을 달성했어요!`;
  }
  
  message += '\n\n당신도 도전해보세요!';
  
  if (deepLink) {
    message += `\n${deepLink}`;
  }

  await shareMessage({ message });
}
