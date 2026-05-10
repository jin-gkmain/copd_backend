import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryCaiStationDto {
  @ApiProperty({
    example: '종로구',
    description:
      '측정소명(에어코리아 CAI API stationName 과 동일해야 합니다. 시도별 수집 DB의 stationName을 참고하세요.)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  stationName!: string;

  @ApiPropertyOptional({
    example: 1,
    description: '페이지 수(1~20). 1이면 최근 페이지만, 늘리면 동일 측정소 이력을 더 가져옵니다.',
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxPages?: number;
}
