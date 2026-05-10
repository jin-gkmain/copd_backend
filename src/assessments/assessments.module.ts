import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Assessment, SixMinuteStepAssessment } from './entities/assessment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, SixMinuteStepAssessment])],
  providers: [AssessmentsService],
  controllers: [AssessmentsController],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
