import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreathingService } from './breathing.service';
import { BreathingController } from './breathing.controller';
import { BreathingData } from './entities/breathing-data.entity';
import { ClinicalProfileModule } from '../clinical-profile/clinical-profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([BreathingData]), ClinicalProfileModule],
  providers: [BreathingService],
  controllers: [BreathingController],
  exports: [BreathingService],
})
export class BreathingModule {}
