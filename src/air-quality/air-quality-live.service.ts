import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AirKoreaCtprvnItem } from './air-korea-api.types';
import { AirKoreaClientService } from './air-korea-client.service';
import { AirQualityMemoryStore } from './air-quality-memory.store';
import { QueryAirKoreaDto } from './dto/query-air-korea.dto';
import { resolveAirKoreaSidoName } from './air-korea-sido.util';

type PollutantLevel = 'good' | 'moderate' | 'unhealthy' | 'unknown';

function gradeToLevel(grade: string | undefined): PollutantLevel {
  const g = grade?.trim();
  if (!g || g === '-') return 'unknown';
  switch (g) {
    case '1':
      return 'good';
    case '2':
      return 'moderate';
    case '3':
    case '4':
      return 'unhealthy';
    default:
      return 'unknown';
  }
}

function khaiGradeToLabel(grade: string | undefined): string {
  const g = grade?.trim();
  switch (g) {
    case '1':
      return '좋음';
    case '2':
      return '보통';
    case '3':
      return '나쁨';
    case '4':
      return '매우 나쁨';
    default:
      return '알 수 없음';
  }
}

function parseDisplayNumber(raw: string | undefined): number | string {
  if (raw === undefined || raw === null) return '—';
  const t = String(raw).trim();
  if (t === '' || t === '-') return '—';
  const n = Number(t);
  return Number.isFinite(n) ? n : t;
}

@Injectable()
export class AirQualityLiveService {
  private readonly logger = new Logger(AirQualityLiveService.name);

  constructor(
    private readonly airKoreaClient: AirKoreaClientService,
    private readonly memoryStore: AirQualityMemoryStore,
  ) {}

  async queryByRegion(dto: QueryAirKoreaDto) {
    if (!this.airKoreaClient.getConfiguredServiceKey()) {
      throw new ServiceUnavailableException(
        '서버에 AIR_KOREA_SERVICE_KEY 가 설정되지 않아 실시간 대기질을 조회할 수 없습니다.',
      );
    }

    const resolvedSido = resolveAirKoreaSidoName(dto.sidoName);
    const keyword = dto.stationKeyword?.trim();

    let items: AirKoreaCtprvnItem[];
    try {
      items = await this.airKoreaClient.fetchAllForSido(resolvedSido);
    } catch (e) {
      this.logger.error(`AirKorea fetch 실패: ${e}`);
      throw new ServiceUnavailableException('에어코리아 API 호출에 실패했습니다.');
    }

    if (!items.length) {
      throw new NotFoundException(`측정 데이터가 없습니다: ${resolvedSido}`);
    }

    const filtered = keyword
      ? items.filter((it) => (it.stationName ?? '').includes(keyword))
      : items;

    const chosen = filtered[0] ?? items[0];
    if (!chosen) {
      throw new NotFoundException(
        keyword
          ? `키워드 "${keyword}"에 맞는 측정소가 없습니다.`
          : '측정소를 찾을 수 없습니다.',
      );
    }

    const overallLevel = gradeToLevel(chosen.khaiGrade);
    const overallLabel = khaiGradeToLabel(chosen.khaiGrade);

    const result = {
      ok: true,
      source: 'airkorea',
      requested: {
        sidoName: dto.sidoName,
        stationKeyword: keyword ?? null,
      },
      resolvedSido,
      station: {
        stationName: chosen.stationName ?? '—',
        stationCode: chosen.stationCode ?? null,
        sidoName: chosen.sidoName ?? resolvedSido,
        dataTime: chosen.dataTime ?? null,
      },
      overall: {
        khaiValue: parseDisplayNumber(chosen.khaiValue),
        khaiGrade: chosen.khaiGrade ?? null,
        level: overallLevel,
        label: overallLabel,
      },
      pollutants: {
        so2: {
          value: parseDisplayNumber(chosen.so2Value),
          unit: 'ppm',
          level: gradeToLevel(chosen.so2Grade),
        },
        no2: {
          value: parseDisplayNumber(chosen.no2Value),
          unit: 'ppm',
          level: gradeToLevel(chosen.no2Grade),
        },
        pm10: {
          value: parseDisplayNumber(chosen.pm10Value),
          unit: 'μg/m³',
          level: gradeToLevel(chosen.pm10Grade),
        },
        pm25: {
          value: parseDisplayNumber(chosen.pm25Value),
          unit: 'μg/m³',
          level: gradeToLevel(chosen.pm25Grade),
        },
      },
      allergens: {
        pollen: {
          value: '—',
          level: 'good' as const,
          unit: '',
          note: '에어코리아 실시간 측정 항목에 꽃가루 농도는 포함되지 않습니다.',
        },
        chemicals: {
          value: '—',
          level: 'good' as const,
          unit: '',
          note: '에어코리아 실시간 측정 항목에 별도 화학물질 지수는 없습니다.',
        },
      },
    };

    this.memoryStore.replaceRealtime(result);
    return result;
  }
}
