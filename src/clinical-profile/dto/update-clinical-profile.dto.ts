import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const smokingStatuses = ['never', 'former', 'current', 'unknown'] as const;

export class UpdateClinicalProfileDto {
  @ApiPropertyOptional({ example: 62 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  fev1PercentPredicted?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  mmrcScore?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(40)
  caatScore?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  exacerbationsLast12Months?: number;

  @ApiPropertyOptional({ enum: smokingStatuses })
  @IsOptional()
  @IsIn(smokingStatuses)
  smokingStatus?: string;

  @ApiPropertyOptional({
    example: { influenza: { received: true, year: 2026 } },
  })
  @IsOptional()
  @IsObject()
  vaccinationHistory?: Record<string, unknown>;
}
