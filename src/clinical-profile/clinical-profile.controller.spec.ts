import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalProfileController } from './clinical-profile.controller';
import { ClinicalProfileService } from './clinical-profile.service';

describe('ClinicalProfileController', () => {
  let controller: ClinicalProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalProfileController],
      providers: [
        {
          provide: ClinicalProfileService,
          useValue: {
            getOrCreate: jest.fn(),
            patch: jest.fn(),
            getSummary: jest.fn(),
            serialize: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClinicalProfileController>(ClinicalProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

