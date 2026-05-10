import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MedicalSurveyService } from './medical-survey.service';
import { SaveMedicalSurveyDto } from './dto/save-medical-survey.dto';

@ApiTags('Medical survey')
@ApiBearerAuth('JWT')
@Controller('medical-survey')
@UseGuards(AuthGuard('jwt'))
export class MedicalSurveyController {
  constructor(private readonly medicalSurveyService: MedicalSurveyService) {}

  @Post()
  @ApiOperation({ summary: '초기 의료 설문 저장(등록 또는 덮어쓰기)' })
  async save(@Request() req: { user: { id: string } }, @Body() dto: SaveMedicalSurveyDto) {
    return this.medicalSurveyService.upsert(req.user.id, dto);
  }

  @Get('status')
  @ApiOperation({ summary: '초기 의료 설문 완료 여부 (항상 200)' })
  async getStatus(@Request() req: { user: { id: string } }) {
    return this.medicalSurveyService.getCompletionStatus(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '내 의료 설문 조회' })
  async getMine(@Request() req: { user: { id: string } }) {
    return this.medicalSurveyService.findMine(req.user.id);
  }
}
