import { Module } from '@nestjs/common';
import { AirKoreaClientService } from './air-korea-client.service';
import { CaiKoreaClientService } from './cai-korea-client.service';
import { AirQualityMemoryStore } from './air-quality-memory.store';
import { AirQualityMockService } from './air-quality-mock.service';
import { AirQualityController } from './air-quality.controller';
import { AirQualityLiveService } from './air-quality-live.service';
import { CaiLiveService } from './cai-live.service';

@Module({
  imports: [],
  controllers: [AirQualityController],
  providers: [
    AirKoreaClientService,
    CaiKoreaClientService,
    AirQualityMemoryStore,
    AirQualityLiveService,
    CaiLiveService,
    AirQualityMockService,
  ],
  exports: [AirQualityMemoryStore],
})
export class AirQualityModule {}
