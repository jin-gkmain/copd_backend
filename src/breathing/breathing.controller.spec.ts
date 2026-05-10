import { Test, TestingModule } from '@nestjs/testing';
import { BreathingController } from './breathing.controller';

describe('BreathingController', () => {
  let controller: BreathingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreathingController],
    }).compile();

    controller = module.get<BreathingController>(BreathingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
