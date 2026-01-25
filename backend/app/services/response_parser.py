"""
AI 응답 파서 모듈
주식 딥리서치 분석 응답 파싱 및 검증
"""
import json
import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


# 유효한 값 목록
VALID_RECOMMENDATIONS = ["strong_buy", "buy", "hold", "sell", "strong_sell"]
VALID_CONFIDENCE_LEVELS = ["low", "medium", "high"]
VALID_SENTIMENTS = ["bullish", "neutral", "bearish"]

# 기본값
DEFAULT_STOCK_ANALYSIS = {
    "deep_research": "분석 데이터를 처리할 수 없습니다.",
    "recommendation": "hold",
    "confidence_level": "low",
    "recommendation_reason": "충분한 데이터가 없어 관망을 권장합니다.",
    "risk_score": 5,
    "risk_analysis": {
        "volatility": "분석 불가",
        "company_specific": "분석 불가",
        "industry": "분석 불가",
        "macro": "분석 불가",
        "liquidity": "분석 불가",
        "regulatory": "분석 불가"
    },
    "market_overview": {
        "price_movement": "분석 불가",
        "volume_trend": "분석 불가",
        "support_resistance": "분석 불가",
        "relative_performance": "분석 불가"
    },
    "market_sentiment": "neutral",
    "sentiment_details": {
        "overall": "분석 불가",
        "social_media": "분석 불가",
        "options_activity": "분석 불가",
        "insider_trading": "분석 불가",
        "institutional": "분석 불가",
        "short_interest": "분석 불가"
    },
    "key_summary": ["분석 데이터를 처리할 수 없습니다."],
    "current_drivers": {
        "news_based": "분석 불가",
        "technical": "분석 불가",
        "fundamental": "분석 불가"
    },
    "future_catalysts": {
        "short_term": "분석 불가",
        "mid_term": "분석 불가",
        "long_term": "분석 불가"
    }
}


def validate_recommendation(value: str) -> str:
    """투자 의사결정 값 검증"""
    value_lower = value.lower().replace(" ", "_")
    if value_lower in VALID_RECOMMENDATIONS:
        return value_lower
    return "hold"


def validate_confidence_level(value: str) -> str:
    """신뢰도 값 검증"""
    value_lower = value.lower()
    if value_lower in VALID_CONFIDENCE_LEVELS:
        return value_lower
    return "low"


def validate_sentiment(value: str) -> str:
    """시장 심리 값 검증"""
    value_lower = value.lower()
    if value_lower in VALID_SENTIMENTS:
        return value_lower
    return "neutral"


def validate_risk_score(score: Any) -> int:
    """위험도 점수 검증 (1-10 범위)"""
    if isinstance(score, (int, float)):
        return max(1, min(10, int(score)))
    return 5


def extract_json_from_text(text: str) -> str:
    """텍스트에서 JSON 추출"""
    # ```json ... ``` 형식에서 추출
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
    if json_match:
        return json_match.group(1)

    # 순수 JSON 형식에서 추출
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        return json_match.group(0)

    raise ValueError("JSON 형식을 찾을 수 없습니다")


def get_default_stock_response() -> Dict:
    """기본 주식 분석 응답 반환 (파싱 실패 시)"""
    return DEFAULT_STOCK_ANALYSIS.copy()


def parse_stock_analysis_response(response_text: str) -> Dict[str, Any]:
    """
    주식 딥리서치 분석 응답 파싱 및 검증

    Args:
        response_text: AI 모델의 응답 텍스트

    Returns:
        파싱된 분석 결과 딕셔너리
    """
    try:
        # JSON 추출
        json_str = extract_json_from_text(response_text)
        parsed = json.loads(json_str)

        # 필수 필드 검증 및 기본값 적용
        result = get_default_stock_response()

        # 메인 필드 업데이트
        if "deep_research" in parsed:
            result["deep_research"] = parsed["deep_research"]

        if "recommendation" in parsed:
            result["recommendation"] = validate_recommendation(parsed["recommendation"])

        if "confidence_level" in parsed:
            result["confidence_level"] = validate_confidence_level(parsed["confidence_level"])

        if "recommendation_reason" in parsed:
            result["recommendation_reason"] = parsed["recommendation_reason"]

        if "risk_score" in parsed:
            result["risk_score"] = validate_risk_score(parsed["risk_score"])

        if "market_sentiment" in parsed:
            result["market_sentiment"] = validate_sentiment(parsed["market_sentiment"])

        if "key_summary" in parsed and isinstance(parsed["key_summary"], list):
            result["key_summary"] = parsed["key_summary"]

        # 중첩 객체 업데이트
        nested_fields = [
            "risk_analysis", "market_overview", "sentiment_details",
            "current_drivers", "future_catalysts"
        ]

        for field in nested_fields:
            if field in parsed and isinstance(parsed[field], dict):
                # 기존 기본값과 병합
                result[field] = {**result[field], **parsed[field]}

        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON 파싱 오류: {e}")
        return get_default_stock_response()
    except ValueError as e:
        logger.error(f"JSON 추출 오류: {e}")
        return get_default_stock_response()
    except Exception as e:
        logger.error(f"응답 파싱 오류: {e}")
        return get_default_stock_response()
