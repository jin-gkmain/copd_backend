import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIR_KOREA_ARPLTN_BASE_URL,
  AIR_KOREA_SIDO_NAMES,
} from './constants/air-korea.constants';
import type {
  AirKoreaCtprvnBody,
  AirKoreaCtprvnItem,
  AirKoreaCtprvnResponse,
} from './air-korea-api.types';

const CTprvn_PATH = '/getCtprvnRltmMesureDnsty';
const DEFAULT_VER = '1.0';
const PAGE_SIZE = 100;

function normalizeItems(body: AirKoreaCtprvnBody | undefined): AirKoreaCtprvnItem[] {
  if (!body?.items) return [];
  return Array.isArray(body.items) ? body.items : [body.items];
}

@Injectable()
export class AirKoreaClientService implements OnModuleInit {
  private readonly logger = new Logger(AirKoreaClientService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (!this.getConfiguredServiceKey()) {
      this.logger.warn(
        'AIR_KOREA_SERVICE_KEY 가 비어 있습니다. POST /air-quality/realtime·/cai 는 503을 반환합니다. ' +
          '로컬: backend/.env 확인. Docker: docker-compose api 환경변수 또는 compose와 같은 디렉터리의 .env',
      );
    }
  }

  getConfiguredServiceKey(): string | undefined {
    const key = this.configService.get<string>('AIR_KOREA_SERVICE_KEY');
    return key?.trim() || undefined;
  }

  /** 시도 하나에 대해 페이지를 모두 순회해 측정소별 항목을 반환 */
  async fetchAllForSido(sidoName: string): Promise<AirKoreaCtprvnItem[]> {
    const serviceKey = this.getConfiguredServiceKey();
    if (!serviceKey) {
      throw new Error('AIR_KOREA_SERVICE_KEY 가 설정되지 않았습니다.');
    }

    const collected: AirKoreaCtprvnItem[] = [];
    let pageNo = 1;

    while (true) {
      const url = new URL(`${AIR_KOREA_ARPLTN_BASE_URL}${CTprvn_PATH}`);
      url.searchParams.set('serviceKey', serviceKey);
      url.searchParams.set('returnType', 'json');
      url.searchParams.set('numOfRows', String(PAGE_SIZE));
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('sidoName', sidoName);
      url.searchParams.set('ver', DEFAULT_VER);

      const res = await fetch(url.toString());
      if (!res.ok) {
        this.logger.warn(`HTTP ${res.status} — ${sidoName} page ${pageNo}`);
        break;
      }

      const json = (await res.json()) as AirKoreaCtprvnResponse;
      const header = json.response?.header;
      if (!header || header.resultCode !== '00') {
        this.logger.warn(
          `API 오류 [${sidoName}] page ${pageNo}: ${header?.resultCode} ${header?.resultMsg}`,
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

  getSidoList(): readonly string[] {
    return AIR_KOREA_SIDO_NAMES;
  }
}
