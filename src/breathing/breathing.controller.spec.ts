import { Test, TestingModule } from '@nestjs/testing';
import { BreathingService } from './breathing.service';
import { BreathingController } from './breathing.controller';

describe('BreathingController', () => {
  let controller: BreathingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreathingController],
      providers: [
        {
          provide: BreathingService,
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BreathingController>(BreathingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
