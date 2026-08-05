import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalProfileService } from '../clinical-profile/clinical-profile.service';
import { computeGoldAirflowGrade } from '../clinical-profile/clinical-classification.engine';
import { BreathingData } from './entities/breathing-data.entity';
import { CreateBreathingDataDto } from './dto/create-breathing-data.dto';

@Injectable()
export class BreathingService {
  constructor(
    @InjectRepository(BreathingData)
    private breathingRepository: Repository<BreathingData>,
    private readonly clinicalProfileService: ClinicalProfileService,
  ) {}

  async create(
    userId: string,
    data: CreateBreathingDataDto,
  ): Promise<BreathingData> {
    const breathingMetrics: Partial<BreathingData> = {
      fev1: data.fev1,
      fvc: data.fvc,
      pef: data.pef,
      fev1PercentPredicted: data.fev1PercentPredicted,
      oxygenSaturation: data.oxygenSaturation,
      heartRate: data.heartRate,
      note: data.note,
      deviceSource: data.deviceSource,
      rawSpiro240: data.rawSpiro240,
    };
    const goldAirflowGrade = computeGoldAirflowGrade(data.fev1PercentPredicted);
    const measuredAt = data.measuredAt ? new Date(data.measuredAt) : undefined;
    const breathingEntry = this.breathingRepository.create({
      ...breathingMetrics,
      userId,
      overallScore: null,
      goldAirflowGrade,
      measuredAt,
    });
    const saved = await this.breathingRepository.save(breathingEntry);
    await this.clinicalProfileService.updateFromBreathing(userId, {
      fev1PercentPredicted: saved.fev1PercentPredicted,
      measuredAt: saved.measuredAt,
    });
    return this.withDerivedFields(saved);
  }

  async findAllByUser(userId: string): Promise<BreathingData[]> {
    const rows = await this.breathingRepository.find({
      where: { userId },
      order: { measuredAt: 'DESC' },
    });
    return rows.map((row) => this.withDerivedFields(row));
  }

  async findOne(id: string, userId: string): Promise<BreathingData> {
    const data = await this.breathingRepository.findOne({
      where: { id, userId },
    });
    if (!data) {
      throw new NotFoundException(`Measurement not found`);
    }
    return this.withDerivedFields(data);
  }

  private withDerivedFields(row: BreathingData): BreathingData {
    const ratio = row.fvc > 0 ? (row.fev1 / row.fvc) * 100 : null;
    return {
      ...row,
      fev1FvcRatio: ratio,
      goldAirflowGrade:
        row.goldAirflowGrade ??
        computeGoldAirflowGrade(row.fev1PercentPredicted),
      source: row.deviceSource ?? null,
    } as BreathingData;
  }
}
