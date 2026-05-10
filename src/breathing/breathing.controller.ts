import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BreathingService } from './breathing.service';
import { CreateBreathingDataDto } from './dto/create-breathing-data.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Breathing')
@ApiBearerAuth('JWT')
@Controller('breathing')
@UseGuards(AuthGuard('jwt'))
export class BreathingController {
  constructor(private readonly breathingService: BreathingService) {}

  @Post()
  @ApiOperation({ summary: '호흡 측정 저장' })
  async create(@Request() req: any, @Body() createDto: CreateBreathingDataDto) {
    return this.breathingService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: '내 호흡 측정 목록' })
  async findAll(@Request() req: any) {
    return this.breathingService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '호흡 측정 단건' })
  @ApiParam({ name: 'id', description: '측정 UUID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.breathingService.findOne(id, req.user.id);
  }
}
