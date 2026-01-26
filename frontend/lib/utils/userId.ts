/**
 * 브라우저 기반 사용자 식별자 관리
 * localStorage에 UUID v4를 저장하여 사용자 식별
 */

const USER_ID_KEY = 'stock_insight_user_id';

/**
 * 사용자 ID 조회 (없으면 생성)
 *
 * @returns UUID v4 형식의 사용자 ID
 * @example
 * const userId = getUserId();
 * // "550e8400-e29b-41d4-a716-446655440000"
 */
export function getUserId(): string {
  // SSR 환경 체크
  if (typeof window === 'undefined') {
    return '';
  }

  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    // crypto.randomUUID()는 모든 모던 브라우저 지원
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

/**
 * 사용자 ID 초기화 (디버깅/테스트용)
 */
export function resetUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_ID_KEY);
}
