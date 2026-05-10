/** 공공데이터포털 ArpltnInforInqireSvc JSON 응답(일반적인 래핑 형태) */
export interface AirKoreaApiHeader {
  resultCode: string;
  resultMsg: string;
}

export interface AirKoreaCtprvnItem {
  stationName?: string;
  stationCode?: string;
  mangName?: string;
  sidoName?: string;
  dataTime?: string;
  so2Value?: string;
  coValue?: string;
  o3Value?: string;
  no2Value?: string;
  pm10Value?: string;
  pm10Value24?: string;
  pm25Value?: string;
  pm25Value24?: string;
  khaiValue?: string;
  khaiGrade?: string;
  so2Grade?: string;
  coGrade?: string;
  o3Grade?: string;
  no2Grade?: string;
  pm10Grade?: string;
  pm25Grade?: string;
}

export interface AirKoreaCtprvnBody {
  items?: AirKoreaCtprvnItem | AirKoreaCtprvnItem[];
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface AirKoreaCtprvnResponse {
  response?: {
    header?: AirKoreaApiHeader;
    body?: AirKoreaCtprvnBody;
  };
}
