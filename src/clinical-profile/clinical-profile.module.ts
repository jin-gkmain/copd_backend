import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { BreathingData } from '../breathing/entities/breathing-data.entity';
import { DailyMorningReport } from '../daily-reports/entities/daily-morning-report.entity';
import { ClinicalProfileController } from './clinical-profile.controller';
import { ClinicalProfileSchemaService } from './clinical-profile-schema.service';
import { ClinicalProfileService } from './clinical-profile.service';
import { ClinicalProfile } from './entities/clinical-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalProfile,
      BreathingData,
      Assessment,
      DailyMorningReport,
    ]),
  ],
  controllers: [ClinicalProfileController],
  providers: [ClinicalProfileSchemaService, ClinicalProfileService],
  exports: [ClinicalProfileService],
})
export class ClinicalProfileModule {}
