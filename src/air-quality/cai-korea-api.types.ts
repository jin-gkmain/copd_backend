/** RltmKhaiInfoSvc / getMsrstnKhaiRltmDnsty JSON 응답(공통 래핑) */
export interface CaiKhaiApiHeader {
  resultCode: string;
  resultMsg: string;
}

/** 문서·샘플 XML에 맞춘 측정소별 CAI 항목(필드는 API에 따라 일부만 올 수 있음) */
export interface CaiKhaiItem {
  dataTime?: string;
  stationName?: string;
  stationCode?: string;
  mangName?: string;
  khaiValue?: string;
  khaiGrade?: string;
  khaiItem?: string;
  so2Value?: string;
  coValue?: string;
  o3Value?: string;
  no2Value?: string;
  pm10Value?: string;
  pm25Value?: string;
  so2Grade?: string;
  coGrade?: string;
  o3Grade?: string;
  no2Grade?: string;
  pm10Grade?: string;
  pm25Grade?: string;
}

export interface CaiKhaiBody {
  items?: CaiKhaiItem | CaiKhaiItem[];
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface CaiKhaiResponse {
  response?: {
    header?: CaiKhaiApiHeader;
    body?: CaiKhaiBody;
  };
}
