"""
사용자별 히스토리 격리 기능 테스트
"""
import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock, patch
import re

# UUID 검증 정규식 (analysis.py와 동일)
UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    re.IGNORECASE
)


class TestGetUserId:
    """get_user_id 의존성 함수 테스트"""

    def test_valid_uuid_v4(self):
        """유효한 UUID v4 형식 테스트"""
        from app.routers.analysis import get_user_id

        valid_uuids = [
            "550e8400-e29b-41d4-a716-446655440000",
            "6ba7b810-9dad-41d8-80b4-00c04fd430c8",
            "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        ]

        for uuid in valid_uuids:
            result = get_user_id(uuid)
            assert result == uuid

    def test_missing_header(self):
        """헤더 누락 시 400 에러"""
        from app.routers.analysis import get_user_id

        with pytest.raises(HTTPException) as exc_info:
            get_user_id(None)

        assert exc_info.value.status_code == 400
        assert "X-User-Id 헤더가 필요합니다" in exc_info.value.detail

    def test_empty_header(self):
        """빈 헤더 시 400 에러"""
        from app.routers.analysis import get_user_id

        with pytest.raises(HTTPException) as exc_info:
            get_user_id("")

        assert exc_info.value.status_code == 400

    def test_invalid_uuid_format(self):
        """잘못된 UUID 형식 테스트"""
        from app.routers.analysis import get_user_id

        invalid_uuids = [
            "invalid-uuid",
            "12345678-1234-1234-1234-123456789012",  # v4가 아님 (3번째 그룹이 4로 시작 안함)
            "550e8400-e29b-41d4-a716",  # 불완전
            "550e8400e29b41d4a716446655440000",  # 하이픈 없음
            "gggggggg-gggg-4ggg-aggg-gggggggggggg",  # 잘못된 문자
        ]

        for uuid in invalid_uuids:
            with pytest.raises(HTTPException) as exc_info:
                get_user_id(uuid)

            assert exc_info.value.status_code == 400
            assert "유효한 UUID 형식" in exc_info.value.detail

    def test_uuid_case_insensitive(self):
        """UUID 대소문자 구분 없이 허용"""
        from app.routers.analysis import get_user_id

        # 대문자 UUID
        upper_uuid = "550E8400-E29B-41D4-A716-446655440000"
        result = get_user_id(upper_uuid)
        assert result == upper_uuid

        # 혼합 대소문자
        mixed_uuid = "550e8400-E29B-41d4-A716-446655440000"
        result = get_user_id(mixed_uuid)
        assert result == mixed_uuid


class TestUUIDPattern:
    """UUID 정규식 패턴 테스트"""

    def test_uuid_v4_pattern_matches(self):
        """UUID v4 패턴 매칭 테스트"""
        # 유효한 UUID v4 (3번째 그룹이 4로 시작, 4번째 그룹이 8,9,a,b로 시작)
        valid = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        assert UUID_PATTERN.match(valid) is not None

    def test_uuid_v1_pattern_fails(self):
        """UUID v1은 거부"""
        # UUID v1 (3번째 그룹이 1로 시작)
        v1_uuid = "550e8400-e29b-11d4-a716-446655440000"
        assert UUID_PATTERN.match(v1_uuid) is None


class TestStockInsightModel:
    """StockInsight 모델 user_id 필드 테스트"""

    def test_model_has_user_id_field(self):
        """모델에 user_id 필드 존재 확인"""
        from app.models.stock_insight import StockInsight

        # user_id 컬럼이 존재하는지 확인
        assert hasattr(StockInsight, 'user_id')

        # 컬럼 속성 확인
        user_id_column = StockInsight.__table__.columns['user_id']
        assert user_id_column is not None
        assert user_id_column.nullable == False  # NOT NULL
        assert user_id_column.index == True  # 인덱스 있음


class TestAPIEndpointsWithUserIsolation:
    """API 엔드포인트 사용자 격리 테스트"""

    @pytest.fixture
    def mock_db(self):
        """Mock 데이터베이스 세션"""
        return AsyncMock()

    def test_history_endpoint_requires_user_id(self):
        """히스토리 엔드포인트에 user_id 의존성 확인"""
        from app.routers.analysis import get_analysis_history
        import inspect

        sig = inspect.signature(get_analysis_history)
        params = list(sig.parameters.keys())

        assert 'user_id' in params

    def test_analyze_endpoint_requires_user_id(self):
        """분석 엔드포인트에 user_id 의존성 확인"""
        from app.routers.analysis import analyze_stock
        import inspect

        sig = inspect.signature(analyze_stock)
        params = list(sig.parameters.keys())

        assert 'user_id' in params

    def test_get_by_id_endpoint_requires_user_id(self):
        """ID 조회 엔드포인트에 user_id 의존성 확인"""
        from app.routers.analysis import get_analysis_by_id
        import inspect

        sig = inspect.signature(get_analysis_by_id)
        params = list(sig.parameters.keys())

        assert 'user_id' in params

    def test_latest_endpoint_requires_user_id(self):
        """최신 분석 엔드포인트에 user_id 의존성 확인"""
        from app.routers.analysis import get_latest_analysis
        import inspect

        sig = inspect.signature(get_latest_analysis)
        params = list(sig.parameters.keys())

        assert 'user_id' in params


class TestStockInsightEngine:
    """StockInsightEngine user_id 파라미터 테스트"""

    def test_generate_insight_accepts_user_id(self):
        """generate_insight에 user_id 파라미터 존재 확인"""
        from app.services.stock_insight_engine import StockInsightEngine
        import inspect

        sig = inspect.signature(StockInsightEngine.generate_insight)
        params = list(sig.parameters.keys())

        assert 'user_id' in params

    def test_generate_insight_user_id_default(self):
        """user_id 기본값 확인"""
        from app.services.stock_insight_engine import StockInsightEngine
        import inspect

        sig = inspect.signature(StockInsightEngine.generate_insight)
        user_id_param = sig.parameters['user_id']

        # 기본값이 빈 문자열인지 확인
        assert user_id_param.default == ""
