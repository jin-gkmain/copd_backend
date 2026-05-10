import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyMorningReportDto } from './dto/create-daily-morning-report.dto';

@ApiTags('Daily reports')
@ApiBearerAuth('JWT')
@Controller('daily-reports')
@UseGuards(AuthGuard('jwt'))
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post('morning')
  @ApiOperation({ summary: '일일 아침 보고 upsert + 위험도 산출' })
  async upsertMorning(@Request() req: { user: { id: string } }, @Body() dto: CreateDailyMorningReportDto) {
    const saved = await this.dailyReportsService.upsertMorning(req.user.id, dto);
    return this.dailyReportsService.serializeReport(saved);
  }

  @Get('morning')
  @ApiOperation({ summary: '최근 아침 보고 목록' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  async listMorning(
    @Request() req: { user: { id: string } },
    @Query('days') days?: string,
  ) {
    const d = days != null ? parseInt(days, 10) : 7;
    const items = await this.dailyReportsService.findMorningRecent(req.user.id, d);
    return items.map((e) => this.dailyReportsService.serializeReport(e));
  }
}
