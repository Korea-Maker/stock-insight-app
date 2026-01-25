/**
 * API 관련 공통 타입 정의
 */

/**
 * 페이지네이션 응답 공통 타입
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip?: number;
  limit?: number;
}
