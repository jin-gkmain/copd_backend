import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalSurvey } from './entities/medical-survey.entity';
import { MedicalSurveyService } from './medical-survey.service';
import { MedicalSurveyController } from './medical-survey.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalSurvey])],
  controllers: [MedicalSurveyController],
  providers: [MedicalSurveyService],
  exports: [MedicalSurveyService],
})
export class MedicalSurveyModule {}
