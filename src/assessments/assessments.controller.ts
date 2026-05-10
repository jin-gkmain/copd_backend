import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateSixMinuteStepAssessmentDto } from './dto/create-six-minute-step.dto';
import { AuthGuard } from '@nestjs/passport';
import { AssessmentType } from './entities/assessment.entity';

@ApiTags('Assessments')
@ApiBearerAuth('JWT')
@Controller('assessments')
@UseGuards(AuthGuard('jwt'))
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @ApiOperation({ summary: '일반 평가 저장 (호흡곤란·우울·불안·삶의 질 등)' })
  async createGeneric(@Request() req: any, @Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.createGeneric(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '일반 평가 목록' })
  @ApiQuery({ name: 'type', required: false, enum: AssessmentType })
  async findAllGeneric(@Request() req: any, @Query('type') type?: AssessmentType) {
    return this.assessmentsService.findAllGenericByUser(req.user.id, type);
  }

  @Post('six-minute-steps')
  @ApiOperation({ summary: '6분 걸음 능력 측정 기록 저장' })
  async createSixMinuteStep(@Request() req: any, @Body() dto: CreateSixMinuteStepAssessmentDto) {
    return this.assessmentsService.createSixMinuteStep(req.user.id, dto);
  }

  @Get('six-minute-steps')
  @ApiOperation({ summary: '6분 걸음 능력 측정 기록 목록' })
  async findAllSixMinuteSteps(@Request() req: any) {
    return this.assessmentsService.findAllSixMinuteStepByUser(req.user.id);
  }
}
