import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClinicalProfileService } from '../clinical-profile/clinical-profile.service';
import { Assessment, SixMinuteStepAssessment } from './entities/assessment.entity';
import { AssessmentsService } from './assessments.service';

describe('AssessmentsService', () => {
  let service: AssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: getRepositoryToken(Assessment),
          useValue: {
            create: jest.fn((v) => v),
            save: jest.fn((v) => Promise.resolve(v)),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SixMinuteStepAssessment),
          useValue: {
            create: jest.fn((v) => v),
            save: jest.fn((v) => Promise.resolve(v)),
            find: jest.fn(),
          },
        },
        {
          provide: ClinicalProfileService,
          useValue: {
            updateFromAssessment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
