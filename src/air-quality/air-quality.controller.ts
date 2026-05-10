import { Body, Controller, Get, NotFoundException, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AirQualityMemoryStore } from './air-quality-memory.store';
import { AirQualityMockService } from './air-quality-mock.service';
import { AirQualityLiveService } from './air-quality-live.service';
import { CaiLiveService } from './cai-live.service';
import { QueryAirKoreaDto } from './dto/query-air-korea.dto';
import { QueryCaiStationDto } from './dto/query-cai-station.dto';

/**
 * 대기질 관련 HTTP API.
 * - POST /air-quality/realtime : 에어코리아 시도별 실시간 (성공 시 인메모리에 덮어씀)
 * - GET  /air-quality/realtime/cache : 위에서 마지막으로 저장한 실시간 결과
 * - POST /air-quality/cai     : CAI 측정소별 (성공 시 인메모리에 덮어씀)
 * - GET  /air-quality/cai/cache : 마지막 CAI 결과
 * - GET  /air-quality/mock     : 개발용 목업
 */
@ApiTags('AirQuality')
@Controller('air-quality')
export class AirQualityController {
  constructor(
    private readonly memoryStore: AirQualityMemoryStore,
    private readonly airQualityMockService: AirQualityMockService,
    private readonly airQualityLiveService: AirQualityLiveService,
    private readonly caiLiveService: CaiLiveService,
  ) {}

  @Post('realtime')
  @ApiBody({ type: QueryAirKoreaDto })
  @ApiOperation({
    summary: '실시간 대기질 (POST, 에어코리아)',
    description:
      '시·도명과 선택적 측정소 키워드를 받아 한국환경공단 대기오염정보 API(getCtprvnRltmMesureDnsty)로 조회합니다. 성공 응답은 서버 프로세스 메모리에만 저장되며, 이전에 저장된 실시간 결과는 삭제됩니다. AIR_KOREA_SERVICE_KEY 가 필요합니다.',
  })
  postRealtime(@Body() dto: QueryAirKoreaDto) {
    return this.airQualityLiveService.queryByRegion(dto);
  }

  @Get('realtime/cache')
  @ApiOperation({
    summary: '인메모리에 저장된 마지막 실시간 대기질',
    description: 'POST /air-quality/realtime 성공 후 조회 가능합니다. 서버 재시작 시 비워집니다.',
  })
  getRealtimeCache() {
    const entry = this.memoryStore.getRealtime();
    if (!entry) {
      throw new NotFoundException(
        '저장된 실시간 대기질이 없습니다. POST /air-quality/realtime 을 먼저 호출하세요.',
      );
    }
    return { storedAt: entry.storedAt.toISOString(), data: entry.data };
  }

  @Post('cai')
  @ApiBody({ type: QueryCaiStationDto })
  @ApiOperation({
    summary: '통합대기환경지수 CAI (POST, RltmKhaiInfoSvc)',
    description:
      '한국환경공단 CAI 조회 API(getMsrstnKhaiRltmDnsty)로 측정소명 기준 통합지수·항목을 조회합니다. 성공 응답은 인메모리에만 저장되며 이전 CAI 결과는 삭제됩니다. AIR_KOREA_SERVICE_KEY 가 필요합니다.',
  })
  postCai(@Body() dto: QueryCaiStationDto) {
    return this.caiLiveService.queryByStationName(dto.stationName, dto.maxPages);
  }

  @Get('cai/cache')
  @ApiOperation({
    summary: '인메모리에 저장된 마지막 CAI 조회 결과',
    description: 'POST /air-quality/cai 성공 후 조회 가능합니다. 서버 재시작 시 비워집니다.',
  })
  getCaiCache() {
    const entry = this.memoryStore.getCai();
    if (!entry) {
      throw new NotFoundException('저장된 CAI 결과가 없습니다. POST /air-quality/cai 를 먼저 호출하세요.');
    }
    return { storedAt: entry.storedAt.toISOString(), data: entry.data };
  }

  @Get('mock')
  @ApiOperation({
    summary: '대기질 목업 (GET, 임의 쿼리)',
    description:
      '쿼리스트링에 원하는 키/값을 자유롭게 붙이면 `received`에 그대로 담아 반환하고, 동일 입력에 대해 결정적인 목업 수치를 `airQuality`에 채웁니다.',
  })
  getMock(@Req() req: Request) {
    const received = normalizeQuery(req.query as Record<string, unknown>);
    return {
      ok: true,
      received,
      airQuality: this.airQualityMockService.buildFromQuery(received),
    };
  }
}

function normalizeQuery(q: Record<string, unknown>): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, raw] of Object.entries(q)) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      out[key] = raw.map((v) => String(v));
    } else if (typeof raw === 'object') {
      out[key] = JSON.stringify(raw);
    } else {
      out[key] = String(raw);
    }
  }
  return out;
}
