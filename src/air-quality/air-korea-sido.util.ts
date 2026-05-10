import { BadRequestException } from '@nestjs/common';
import { AIR_KOREA_SIDO_NAMES } from './constants/air-korea.constants';

/** 회원가입·UI에서 쓰는 행정구역명 → getCtprvnRltmMesureDnsty 의 sidoName */
const ALIAS_TO_SIDO: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

const SIDO_SET = new Set<string>([...AIR_KOREA_SIDO_NAMES]);

/**
 * 사용자 입력 문자열을 에어코리아 API sidoName 으로 변환
 */
export function resolveAirKoreaSidoName(raw: string): string {
  const t = raw.trim();
  if (!t) {
    throw new BadRequestException('sidoName 은 비울 수 없습니다.');
  }

  if (SIDO_SET.has(t)) {
    return t;
  }

  const aliased = ALIAS_TO_SIDO[t];
  if (aliased) {
    return aliased;
  }

  for (const sido of AIR_KOREA_SIDO_NAMES) {
    if (t.startsWith(sido)) {
      return sido;
    }
  }

  throw new BadRequestException(
    `지원하지 않는 시·도입니다: "${raw}". 허용 예: 서울, 경기, 서울특별시, 경기도 등`,
  );
}
