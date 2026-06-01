import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClinicalProfileService } from '../clinical-profile/clinical-profile.service';
import { BreathingData } from './entities/breathing-data.entity';
import { BreathingService } from './breathing.service';

describe('BreathingService', () => {
  let service: BreathingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreathingService,
        {
          provide: getRepositoryToken(BreathingData),
          useValue: {
            create: jest.fn((v) => v),
            save: jest.fn((v) => Promise.resolve({ ...v, measuredAt: new Date() })),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ClinicalProfileService,
          useValue: {
            updateFromBreathing: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BreathingService>(BreathingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
