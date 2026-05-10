import { Test, TestingModule } from '@nestjs/testing';
import { BreathingService } from './breathing.service';

describe('BreathingService', () => {
  let service: BreathingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BreathingService],
    }).compile();

    service = module.get<BreathingService>(BreathingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
