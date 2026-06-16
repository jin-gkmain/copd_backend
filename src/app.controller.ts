import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '서버 기동 확인' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: '프로세스 헬스 체크' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('version')
  @ApiOperation({ summary: '배포 버전 확인' })
  getVersion() {
    return this.appService.getVersion();
  }
}
