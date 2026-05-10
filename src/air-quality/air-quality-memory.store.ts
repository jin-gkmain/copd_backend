import { Injectable } from '@nestjs/common';

/** 에어코리아 조회 결과는 DB 없이 프로세스 메모리에만 보관(새 호출 시 이전 값 폐기) */
export interface AirQualityCacheEntry<T = unknown> {
  storedAt: Date;
  data: T;
}

@Injectable()
export class AirQualityMemoryStore {
  private realtime: AirQualityCacheEntry | null = null;
  private cai: AirQualityCacheEntry | null = null;

  replaceRealtime(data: unknown): void {
    this.realtime = { storedAt: new Date(), data };
  }

  getRealtime(): AirQualityCacheEntry | null {
    return this.realtime;
  }

  replaceCai(data: unknown): void {
    this.cai = { storedAt: new Date(), data };
  }

  getCai(): AirQualityCacheEntry | null {
    return this.cai;
  }
}
