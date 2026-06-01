import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClinicalProfileService } from './clinical-profile.service';
import { UpdateClinicalProfileDto } from './dto/update-clinical-profile.dto';

@ApiTags('Clinical profile')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ClinicalProfileController {
  constructor(private readonly clinicalProfileService: ClinicalProfileService) {}

  @Get('clinical-profile')
  @ApiOperation({ summary: '내 임상 프로필' })
  async getProfile(@Request() req: { user: { id: string } }) {
    const profile = await this.clinicalProfileService.getOrCreate(req.user.id);
    return this.clinicalProfileService.serialize(profile);
  }

  @Patch('clinical-profile')
  @ApiOperation({ summary: '내 임상 프로필 수정' })
  async patchProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateClinicalProfileDto,
  ) {
    const profile = await this.clinicalProfileService.patch(req.user.id, dto);
    return this.clinicalProfileService.serialize(profile);
  }

  @Get('clinical-summary')
  @ApiOperation({ summary: 'GOLD 및 일일 위험도 기반 임상 요약' })
  async getSummary(@Request() req: { user: { id: string } }) {
    return this.clinicalProfileService.getSummary(req.user.id);
  }
}

