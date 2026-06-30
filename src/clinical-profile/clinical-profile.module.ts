import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Assessment,
  SixMinuteStepAssessment,
} from '../assessments/entities/assessment.entity';
import { BreathingData } from '../breathing/entities/breathing-data.entity';
import { DailyMorningReport } from '../daily-reports/entities/daily-morning-report.entity';
import { ClinicalProfileController } from './clinical-profile.controller';
import { ClinicalProfileSchemaService } from './clinical-profile-schema.service';
import { ClinicalProfileService } from './clinical-profile.service';
import { ClinicalProfile } from './entities/clinical-profile.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalProfile,
      BreathingData,
      Assessment,
      SixMinuteStepAssessment,
      DailyMorningReport,
      User,
    ]),
  ],
  controllers: [ClinicalProfileController],
  providers: [ClinicalProfileSchemaService, ClinicalProfileService],
  exports: [ClinicalProfileService],
})
export class ClinicalProfileModule {}
