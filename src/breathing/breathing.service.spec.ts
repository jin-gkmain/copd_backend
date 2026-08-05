import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClinicalProfileService } from '../clinical-profile/clinical-profile.service';
import { BreathingData } from './entities/breathing-data.entity';
import { BreathingService } from './breathing.service';

describe('BreathingService', () => {
  let service: BreathingService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let clinicalProfileService: { updateFromBreathing: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreathingService,
        {
          provide: getRepositoryToken(BreathingData),
          useValue: {
            create: jest.fn((v) => v),
            save: jest.fn((v) =>
              Promise.resolve({ ...v, measuredAt: new Date() }),
            ),
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
    repository = module.get(getRepositoryToken(BreathingData));
    clinicalProfileService = module.get(ClinicalProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stores clinical metrics without inventing a 0-100 breathing score', async () => {
    await service.create('user-id', {
      fev1: 2.2,
      fvc: 3.1,
      pef: 360,
      fev1PercentPredicted: 80,
      deviceSource: 'spiro_q',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        overallScore: null,
        goldAirflowGrade: 'GOLD 1',
      }),
    );
    expect(clinicalProfileService.updateFromBreathing).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ fev1PercentPredicted: 80 }),
    );
  });
});
