import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, Min } from 'class-validator';

/**
 * Flutter `MedicalSurveyPayload.toJson()` 구조와 동일.
 */
export class SaveMedicalSurveyDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  version: number;

  @ApiProperty()
  @IsObject()
  diseaseHistory: Record<string, unknown>;

  @ApiProperty()
  @IsObject()
  surgicalAndProcedureHistory: Record<string, unknown>;

  @ApiProperty()
  @IsObject()
  medicationHistory: Record<string, unknown>;

  @ApiProperty()
  @IsObject()
  supplementHistory: Record<string, unknown>;

  @ApiProperty()
  @IsObject()
  familyHistory: Record<string, unknown>;
}
