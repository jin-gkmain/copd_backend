import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { CaiKhaiItem } from './cai-korea-api.types';
import { CaiKoreaClientService } from './cai-korea-client.service';
import { AirQualityMemoryStore } from './air-quality-memory.store';
import { parseAirKoreaDataTime } from './air-korea-time.util';

function pickLatestItem(items: CaiKhaiItem[]): CaiKhaiItem | null {
  let best: CaiKhaiItem | null = null;
  let bestT = 0;
  for (const it of items) {
    const d = parseAirKoreaDataTime(it.dataTime);
    if (!d) continue;
    const t = d.getTime();
    if (t >= bestT) {
      bestT = t;
      best = it;
    }
  }
  return best;
}

@Injectable()
export class CaiLiveService {
  private readonly logger = new Logger(CaiLiveService.name);

  constructor(
    private readonly caiClient: CaiKoreaClientService,
    private readonly memoryStore: AirQualityMemoryStore,
  ) {}

  /** Swagger/클라이언트용: 측정소명으로 CAI API 직조회 */
  async queryByStationName(stationName: string, maxPages?: number) {
    if (!this.caiClient.getConfiguredServiceKey()) {
      throw new ServiceUnavailableException(
        '서버에 AIR_KOREA_SERVICE_KEY 가 설정되지 않아 CAI를 조회할 수 없습니다.',
      );
    }

    const pages = Math.min(Math.max(maxPages ?? 1, 1), 20);

    let items: CaiKhaiItem[];
    try {
      items = await this.caiClient.fetchKhaiForStation(stationName, { maxPages: pages });
    } catch (e) {
      this.logger.error(`CAI fetch 실패: ${e}`);
      throw new ServiceUnavailableException('CAI API 호출에 실패했습니다.');
    }

    if (!items.length) {
      throw new NotFoundException(`CAI 데이터가 없습니다: ${stationName.trim()}`);
    }

    const latest = pickLatestItem(items);

    const result = {
      ok: true,
      source: 'airkorea-rltm-khai',
      requested: { stationName: stationName.trim(), maxPages: pages },
      itemCount: items.length,
      latest: latest ?? items[0],
      items: pages > 1 ? items : undefined,
    };

    this.memoryStore.replaceCai(result);
    return result;
  }
}
