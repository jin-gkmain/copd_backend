import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Assessment, SixMinuteStepAssessment } from './entities/assessment.entity';
import { ClinicalProfileModule } from '../clinical-profile/clinical-profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, SixMinuteStepAssessment]), ClinicalProfileModule],
  providers: [AssessmentsService],
  controllers: [AssessmentsController],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
