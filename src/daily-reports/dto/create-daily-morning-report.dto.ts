import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class DailyStepSnapshotDto {
  @ApiProperty({ example: '2026-04-21' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  steps: number;
}

export class CreateDailyMorningReportDto {
  @ApiProperty({ example: '2026-04-21' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  reportingDay: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientTimezone?: string;

  @ApiProperty({ enum: ['up', 'same', 'down'] })
  @IsIn(['up', 'same', 'down'])
  dyspnea: 'up' | 'same' | 'down';

  @ApiProperty({ enum: ['up', 'same', 'down'] })
  @IsIn(['up', 'same', 'down'])
  cough: 'up' | 'same' | 'down';

  @ApiProperty({ enum: ['up', 'same', 'down'] })
  @IsIn(['up', 'same', 'down'])
  sputumAmount: 'up' | 'same' | 'down';

  @ApiProperty({ enum: ['clear', 'yellow', 'green'] })
  @IsIn(['clear', 'yellow', 'green'])
  sputumColor: 'clear' | 'yellow' | 'green';

  @ApiProperty()
  @IsBoolean()
  fatigue: boolean;

  @ApiProperty()
  @IsBoolean()
  chestPain: boolean;

  @ApiPropertyOptional({ type: [DailyStepSnapshotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyStepSnapshotDto)
  dailyStepsSnapshot?: DailyStepSnapshotDto[];
}
