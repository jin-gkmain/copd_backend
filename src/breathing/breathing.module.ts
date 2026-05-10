import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreathingService } from './breathing.service';
import { BreathingController } from './breathing.controller';
import { BreathingData } from './entities/breathing-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BreathingData])],
  providers: [BreathingService],
  controllers: [BreathingController],
  exports: [BreathingService],
})
export class BreathingModule {}
