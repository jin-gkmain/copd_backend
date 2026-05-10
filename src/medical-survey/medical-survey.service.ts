import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalSurvey } from './entities/medical-survey.entity';
import { SaveMedicalSurveyDto } from './dto/save-medical-survey.dto';

@Injectable()
export class MedicalSurveyService {
  constructor(
    @InjectRepository(MedicalSurvey)
    private readonly repo: Repository<MedicalSurvey>,
  ) {}

  async upsert(userId: string, dto: SaveMedicalSurveyDto): Promise<MedicalSurvey> {
    const payload = { ...dto } as unknown as Record<string, unknown>;
    const submittedAt = new Date();

    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) {
      existing.payload = payload;
      existing.submittedAt = submittedAt;
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      userId,
      payload,
      submittedAt,
    });
    return this.repo.save(entity);
  }

  async findMine(userId: string): Promise<MedicalSurvey> {
    const row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      throw new NotFoundException('저장된 의료 설문이 없습니다.');
    }
    return row;
  }

  async getCompletionStatus(userId: string): Promise<{ completed: boolean }> {
    const row = await this.repo.findOne({ where: { userId } });
    return { completed: !!row };
  }
}
