import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API name', () => {
      expect(appController.getHello()).toBe('COPD Care API');
    });
  });

  describe('health', () => {
    it('should return process health', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptimeSeconds: expect.any(Number),
      });
    });
  });

  describe('version', () => {
    it('should return deployment version metadata', () => {
      const version = appController.getVersion();
      expect(version).toEqual(
        expect.objectContaining({
          name: 'copd_backend',
          version: expect.any(String),
          nodeEnv: expect.any(String),
        }),
      );
      expect(version.gitSha == null || typeof version.gitSha === 'string').toBe(
        true,
      );
    });
  });
});
