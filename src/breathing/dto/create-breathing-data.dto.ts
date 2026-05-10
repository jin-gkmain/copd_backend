import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateBreathingDataDto {
  @IsNumber()
  @Min(0)
  fev1: number;

  @IsNumber()
  @Min(0)
  fvc: number;

  @IsNumber()
  @IsOptional()
  pef?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  oxygenSaturation?: number;

  @IsNumber()
  @IsOptional()
  heartRate?: number;

  @IsString()
  @IsOptional()
  note?: string;
}
