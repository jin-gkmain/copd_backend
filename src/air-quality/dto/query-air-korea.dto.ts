import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryAirKoreaDto {
  @ApiProperty({
    example: '서울특별시',
    description: '시·도 (행정명 전체 또는 에어코리아 API용 축약명, 예: 서울, 경기)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  sidoName!: string;

  @ApiPropertyOptional({
    example: '강남',
    description: '측정소명·구 키워드(부분 일치). 생략 시 해당 시도 첫 측정소 기준',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  stationKeyword?: string;
}
