import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BreathingData } from './entities/breathing-data.entity';

@Injectable()
export class BreathingService {
  constructor(
    @InjectRepository(BreathingData)
    private breathingRepository: Repository<BreathingData>,
  ) {}

  /**
   * Calculates a score between 0 and 100 based on breathing metrics.
   * This is a simplified example of scoring logic.
   */
  private calculateScore(data: Partial<BreathingData>): number {
    let score = 0;
    
    // FEV1/FVC Ratio (normal is > 0.7)
    if (data.fev1 && data.fvc) {
      const ratio = data.fev1 / data.fvc;
      if (ratio >= 0.7) score += 40;
      else if (ratio >= 0.6) score += 30;
      else if (ratio >= 0.5) score += 20;
      else score += 10;
    }

    // Oxygen Saturation (SpO2) (normal is 95-100%)
    if (data.oxygenSaturation) {
      if (data.oxygenSaturation >= 95) score += 40;
      else if (data.oxygenSaturation >= 90) score += 30;
      else if (data.oxygenSaturation >= 85) score += 20;
      else score += 10;
    } else {
      score += 20; // Default if not measured
    }

    // Peak Flow (PEF) contribution
    if (data.pef) {
      score += 20; 
    } else {
      score += 10;
    }

    return Math.min(score, 100);
  }

  async create(userId: string, data: Partial<BreathingData>): Promise<BreathingData> {
    const overallScore = this.calculateScore(data);
    const breathingEntry = this.breathingRepository.create({
      ...data,
      userId,
      overallScore,
    });
    return this.breathingRepository.save(breathingEntry);
  }

  async findAllByUser(userId: string): Promise<BreathingData[]> {
    return this.breathingRepository.find({
      where: { userId },
      order: { measuredAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<BreathingData> {
    const data = await this.breathingRepository.findOne({
      where: { id, userId },
    });
    if (!data) {
      throw new NotFoundException(`Measurement not found`);
    }
    return data;
  }
}
