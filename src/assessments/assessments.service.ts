import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, AssessmentType, SixMinuteStepAssessment } from './entities/assessment.entity';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateSixMinuteStepAssessmentDto } from './dto/create-six-minute-step.dto';
import { ClinicalProfileService } from '../clinical-profile/clinical-profile.service';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(SixMinuteStepAssessment)
    private sixMinuteStepRepository: Repository<SixMinuteStepAssessment>,
    private readonly clinicalProfileService: ClinicalProfileService,
  ) {}

  async createGeneric(userId: string, dto: CreateAssessmentDto): Promise<Assessment> {
    const assessment = this.assessmentRepository.create({
      ...dto,
      userId,
    });
    const saved = await this.assessmentRepository.save(assessment);
    await this.clinicalProfileService.updateFromAssessment(userId, saved);
    return saved;
  }

  async findAllGenericByUser(userId: string, type?: AssessmentType): Promise<Assessment[]> {
    const where: any = { userId };
    if (type) where.type = type;

    return this.assessmentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async createSixMinuteStep(
    userId: string,
    dto: CreateSixMinuteStepAssessmentDto,
  ): Promise<SixMinuteStepAssessment> {
    const row = this.sixMinuteStepRepository.create({
      userId,
      steps: dto.steps,
      durationSeconds: dto.durationSeconds,
      estimatedDistanceMeters:
        dto.estimatedDistanceMeters === undefined || dto.estimatedDistanceMeters === null
          ? null
          : Number(dto.estimatedDistanceMeters),
      startedAt: new Date(dto.startedAt),
      endedAt: new Date(dto.endedAt),
      interpretationLevel: dto.interpretationLevel ?? null,
    });
    return this.sixMinuteStepRepository.save(row);
  }

  async findAllSixMinuteStepByUser(userId: string): Promise<SixMinuteStepAssessment[]> {
    return this.sixMinuteStepRepository.find({
      where: { userId },
      order: { endedAt: 'DESC' },
    });
  }
}
