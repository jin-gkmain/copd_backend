import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';

describe('AssessmentsController', () => {
  let controller: AssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [
        {
          provide: AssessmentsService,
          useValue: {
            createGeneric: jest.fn(),
            findAllGenericByUser: jest.fn(),
            createSixMinuteStep: jest.fn(),
            findAllSixMinuteStepByUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AssessmentsController>(AssessmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
