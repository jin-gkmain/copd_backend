import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyMorningReport } from './entities/daily-morning-report.entity';
import { DailyReportsService } from './daily-reports.service';
import { DailyReportsController } from './daily-reports.controller';
import { BreathingModule } from '../breathing/breathing.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyMorningReport]), BreathingModule],
  controllers: [DailyReportsController],
  providers: [DailyReportsService],
  exports: [DailyReportsService],
})
export class DailyReportsModule {}
