import { IsEnum, IsNotEmpty, IsNumber, IsObject, Min } from 'class-validator';
import { AssessmentType } from '../entities/assessment.entity';

export class CreateAssessmentDto {
  @IsEnum(AssessmentType)
  @IsNotEmpty()
  type: AssessmentType;

  @IsObject()
  @IsNotEmpty()
  responses: Record<string, unknown>;

  /** 척도 합계·점수 (소수 포함 가능, 앱에서 double로 전달) */
  @IsNumber()
  @Min(0)
  score: number;
}
