import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSixMinuteStepAssessmentDto {
  @IsInt()
  @Min(0)
  @Max(50000)
  steps: number;

  @IsInt()
  @Min(1)
  @Max(7200)
  durationSeconds: number;

  @IsNumber()
  @IsOptional()
  estimatedDistanceMeters?: number;

  @IsDateString()
  startedAt: string;

  @IsDateString()
  endedAt: string;

  @IsString()
  @IsOptional()
  interpretationLevel?: string;
}
