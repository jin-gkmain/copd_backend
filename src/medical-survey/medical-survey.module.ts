import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalSurvey } from './entities/medical-survey.entity';
import { MedicalSurveyService } from './medical-survey.service';
import { MedicalSurveyController } from './medical-survey.controller';
import { ClinicalProfileModule } from '../clinical-profile/clinical-profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalSurvey]), ClinicalProfileModule],
  controllers: [MedicalSurveyController],
  providers: [MedicalSurveyService],
  exports: [MedicalSurveyService],
})
export class MedicalSurveyModule {}
