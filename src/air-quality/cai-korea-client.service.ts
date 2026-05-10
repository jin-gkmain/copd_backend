import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CAI_KHAI_PATH, CAI_KOREA_RLTM_KHAI_BASE_URL } from './constants/cai-korea.constants';
import type { CaiKhaiBody, CaiKhaiItem, CaiKhaiResponse } from './cai-korea-api.types';

const PAGE_SIZE = 100;

function normalizeItems(body: CaiKhaiBody | undefined): CaiKhaiItem[] {
  if (!body?.items) return [];
  return Array.isArray(body.items) ? body.items : [body.items];
}

@Injectable()
export class CaiKoreaClientService {
  private readonly logger = new Logger(CaiKoreaClientService.name);

  constructor(private readonly configService: ConfigService) {}

  getConfiguredServiceKey(): string | undefined {
    const key = this.configService.get<string>('AIR_KOREA_SERVICE_KEY');
    return key?.trim() || undefined;
  }

  /**
   * 측정소명 기준 CAI 실시간 데이터.
   * @param maxPages 호출 수 제한(기본 1페이지면 최신 구간만; 이력이 필요하면 늘림)
   */
  async fetchKhaiForStation(
    stationName: string,
    options?: { maxPages?: number },
  ): Promise<CaiKhaiItem[]> {
    const serviceKey = this.getConfiguredServiceKey();
    if (!serviceKey) {
      throw new Error('AIR_KOREA_SERVICE_KEY 가 설정되지 않았습니다.');
    }

    const trimmed = stationName.trim();
    if (!trimmed) {
      throw new Error('stationName 이 비어 있습니다.');
    }

    const maxPages = Math.max(1, options?.maxPages ?? 1);
    const collected: CaiKhaiItem[] = [];
    let pageNo = 1;

    while (pageNo <= maxPages) {
      const url = new URL(`${CAI_KOREA_RLTM_KHAI_BASE_URL}${CAI_KHAI_PATH}`);
      url.searchParams.set('serviceKey', serviceKey);
      url.searchParams.set('returnType', 'json');
      url.searchParams.set('numOfRows', String(PAGE_SIZE));
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('stationName', trimmed);

      const res = await fetch(url.toString());
      if (!res.ok) {
        this.logger.warn(`HTTP ${res.status} — CAI [${trimmed}] page ${pageNo}`);
        break;
      }

      const json = (await res.json()) as CaiKhaiResponse;
      const header = json.response?.header;
      if (!header || header.resultCode !== '00') {
        this.logger.warn(
          `CAI API 오류 [${trimmed}] page ${pageNo}: ${header?.resultCode} ${header?.resultMsg}`,
        );
        break;
      }

      const body = json.response?.body;
      const items = normalizeItems(body);
      collected.push(...items);

      const totalCount = body?.totalCount ?? 0;
      if (items.length === 0 || pageNo * PAGE_SIZE >= totalCount) {
        break;
      }
      pageNo += 1;
    }

    return collected;
  }
}
