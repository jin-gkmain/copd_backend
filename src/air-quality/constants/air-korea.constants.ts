/**
 * getCtprvnRltmMesureDnsty 의 sidoName 파라미터에 사용하는 시·도 이름.
 * (한국환경공단 대기오염정보 Open API 기술문서 기준)
 */
export const AIR_KOREA_SIDO_NAMES = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export const AIR_KOREA_ARPLTN_BASE_URL =
  'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';
