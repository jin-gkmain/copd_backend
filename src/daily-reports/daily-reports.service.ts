import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyMorningReport } from './entities/daily-morning-report.entity';
import { CreateDailyMorningReportDto } from './dto/create-daily-morning-report.dto';
import {
  computeDailyRisk,
  payloadFromUnknown,
  subReportingDays,
  type ReportRow,
  type StepSnap,
  type RiskLevel,
} from './daily-risk.engine';
import {
  applyTemporalRiskOverlay,
  parseStoredRiskLevel,
} from './daily-risk-temporal';

@Injectable()
export class DailyReportsService {
  constructor(
    @InjectRepository(DailyMorningReport)
    private readonly reportRepo: Repository<DailyMorningReport>,
  ) {}

  private buildPayload(
    dto: CreateDailyMorningReportDto,
  ): Record<string, unknown> {
    return {
      dyspnea: dto.dyspnea,
      cough: dto.cough,
      sputumAmount: dto.sputumAmount,
      sputumColor: dto.sputumColor,
      fatigue: dto.fatigue,
      chestPain: dto.chestPain,
    };
  }

  private toReportRows(entities: DailyMorningReport[]): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const e of entities) {
      const p = payloadFromUnknown(e.payload);
      if (p) rows.push({ reportingDay: e.reportingDay, payload: p });
    }
    return rows;
  }

  async upsertMorning(
    userId: string,
    dto: CreateDailyMorningReportDto,
  ): Promise<DailyMorningReport> {
    const payload = this.buildPayload(dto);
    let entity = await this.reportRepo.findOne({
      where: { userId, reportingDay: dto.reportingDay },
    });
    if (!entity) {
      entity = this.reportRepo.create({
        userId,
        reportingDay: dto.reportingDay,
        payload,
        clientTimezone: dto.clientTimezone ?? null,
      });
    } else {
      entity.payload = payload;
      entity.clientTimezone = dto.clientTimezone ?? entity.clientTimezone;
    }
    await this.reportRepo.save(entity);

    const recent = await this.reportRepo.find({
      where: { userId },
      order: { reportingDay: 'DESC' },
      take: 21,
    });
    const asc = [...recent].sort((a, b) =>
      a.reportingDay.localeCompare(b.reportingDay),
    );
    const minKey = subReportingDays(dto.reportingDay, 6);
    const inWindow = asc.filter(
      (e) => e.reportingDay >= minKey && e.reportingDay <= dto.reportingDay,
    );
    const rows = this.toReportRows(inWindow);

    let steps: StepSnap[] | undefined;
    if (dto.dailyStepsSnapshot?.length) {
      steps = dto.dailyStepsSnapshot.map((s) => ({
        date: s.date,
        steps: s.steps,
      }));
    }

    const { level: baseLevel, reasonCodes: baseReasonCodes } = computeDailyRisk(
      {
        reportsAscending: rows,
        todayReportingDay: dto.reportingDay,
        dailyStepsSnapshot: steps,
      },
    );

    const yKey = subReportingDays(dto.reportingDay, 1);
    const d2Key = subReportingDays(dto.reportingDay, 2);
    const yEnt = asc.find((r) => r.reportingDay === yKey);
    const d2Ent = asc.find((r) => r.reportingDay === d2Key);

    const readHistoricalBase = (
      e: DailyMorningReport | undefined,
    ): RiskLevel | null => {
      if (!e) return null;
      return parseStoredRiskLevel(e.baseComputedRisk ?? e.computedRisk);
    };

    const { level: finalLevel, reasonCodes: finalReasons } =
      applyTemporalRiskOverlay({
        baseLevel,
        baseReasonCodes,
        yesterdayBase: readHistoricalBase(yEnt),
        dayBeforeYesterdayBase: readHistoricalBase(d2Ent),
      });

    entity.baseComputedRisk = baseLevel;
    entity.computedRisk = finalLevel;
    entity.reasonCodes = finalReasons;
    await this.reportRepo.save(entity);
    return entity;
  }

  async findMorningRecent(
    userId: string,
    days: number,
  ): Promise<DailyMorningReport[]> {
    const n = Math.min(Math.max(days || 7, 1), 30);
    return this.reportRepo.find({
      where: { userId },
      order: { reportingDay: 'DESC' },
      take: n,
    });
  }

  serializeReport(e: DailyMorningReport) {
    return {
      id: e.id,
      userId: e.userId,
      reportingDay: e.reportingDay,
      payload: e.payload,
      clientTimezone: e.clientTimezone,
      baseComputedRisk: e.baseComputedRisk,
      computedRisk: e.computedRisk,
      risk: e.computedRisk,
      reasonCodes: e.reasonCodes ?? [],
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
