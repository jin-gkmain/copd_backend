import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isPhoneNumberAvailable: jest.fn(),
            register: jest.fn(),
            validateUser: jest.fn(),
            login: jest.fn(),
            changePassword: jest.fn(),
            deleteAccount: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            updateProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
