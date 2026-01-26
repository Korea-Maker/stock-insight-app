# -*- coding: utf-8 -*-
"""
한국 주식 검색 기능 테스트 스크립트

사용법:
1. 가상환경 활성화: .venv/Scripts/activate (Windows)
2. 의존성 설치: pip install -r requirements.txt
3. 테스트 실행: python test_kr_stock.py
"""
import asyncio
import logging
import warnings

# SSL 검증 비활성화 (회사 네트워크 환경)
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import requests
old_merge = requests.Session.merge_environment_settings
def new_merge(self, url, proxies, stream, verify, cert):
    settings = old_merge(self, url, proxies, stream, verify, cert)
    settings['verify'] = False
    return settings
requests.Session.merge_environment_settings = new_merge

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def test_pykrx_import():
    """pykrx 라이브러리 임포트 테스트"""
    print("\n" + "="*60)
    print("1. pykrx 라이브러리 임포트 테스트")
    print("="*60)
    try:
        from pykrx import stock
        tickers = stock.get_market_ticker_list(market="KOSPI")[:5]
        print(f"[OK] pykrx 임포트 성공")
        print(f"   KOSPI 종목 샘플: {tickers}")
        return True
    except ImportError as e:
        print(f"[FAIL] pykrx 임포트 실패: {e}")
        print("   pip install pykrx 명령으로 설치하세요.")
        return False
    except Exception as e:
        print(f"[FAIL] pykrx 테스트 실패: {e}")
        return False


async def test_kr_stock_cache():
    """한국 종목 캐시 서비스 테스트"""
    print("\n" + "="*60)
    print("2. 한국 종목 캐시 서비스 테스트")
    print("="*60)
    try:
        from app.services.kr_stock_cache import kr_stock_cache

        # 캐시 초기화 (첫 호출 시 자동 로드)
        print("   캐시 초기화 중... (첫 실행 시 시간이 걸릴 수 있습니다)")
        results = await kr_stock_cache.search("삼성", limit=5)

        print(f"[OK] 캐시 초기화 완료: {kr_stock_cache.stock_count}개 종목")
        print(f"   '삼성' 검색 결과:")
        for r in results:
            print(f"   - {r['name']} ({r['symbol']})")

        return True
    except Exception as e:
        print(f"[FAIL] 캐시 서비스 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_search_stock():
    """종목 검색 API 테스트"""
    print("\n" + "="*60)
    print("3. 종목 검색 API 테스트")
    print("="*60)
    try:
        from app.services.stock_data_service import stock_data_service

        # 테스트 케이스
        test_cases = [
            ("현대글로비스", "매핑에 없는 한국 종목 검색"),
            ("086280", "숫자 코드로 검색"),
            ("삼성", "부분 일치 검색"),
            ("에코프로", "코스닥 종목 검색"),
            ("AAPL", "미국 종목 검색"),
        ]

        for query, description in test_cases:
            print(f"\n   테스트: {description} (검색어: '{query}')")
            results = await stock_data_service.search_stock(query)
            if results:
                print(f"   [OK] 결과: {len(results)}개")
                for r in results[:3]:
                    print(f"      - {r['name']} ({r['symbol']}) [{r['market']}]")
            else:
                print(f"   [WARN] 결과 없음")

        return True
    except Exception as e:
        print(f"[FAIL] 검색 API 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_resolve_stock_code():
    """종목 코드 해석 테스트"""
    print("\n" + "="*60)
    print("4. 종목 코드 해석 테스트")
    print("="*60)
    try:
        from app.services.stock_data_service import stock_data_service

        test_cases = [
            "현대글로비스",  # pykrx에서 검색
            "086280",       # 숫자 코드 (KOSPI/KOSDAQ 자동 판별)
            "383310",       # 코스닥 종목 코드
            "삼성전자",      # 하드코딩 매핑
            "AAPL",         # 미국 종목
        ]

        for query in test_cases:
            symbol, market = await stock_data_service.resolve_stock_code(query)
            print(f"   '{query}' -> ({symbol}, {market})")

        print("\n[OK] 종목 코드 해석 테스트 완료")
        return True
    except Exception as e:
        print(f"[FAIL] 종목 코드 해석 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """메인 테스트 실행"""
    print("\n" + "="*60)
    print("한국 주식 지원 개선 테스트")
    print("="*60)

    # 1. pykrx 임포트 테스트
    if not await test_pykrx_import():
        print("\n[WARN] pykrx가 설치되지 않아 나머지 테스트를 건너뜁니다.")
        return

    # 2. 캐시 서비스 테스트
    await test_kr_stock_cache()

    # 3. 검색 API 테스트
    await test_search_stock()

    # 4. 종목 코드 해석 테스트
    await test_resolve_stock_code()

    print("\n" + "="*60)
    print("테스트 완료!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
