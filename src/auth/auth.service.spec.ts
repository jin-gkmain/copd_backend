import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findOneByPhoneNumber: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    updatePassword: jest.Mock;
    deleteAccountData: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findOneByPhoneNumber: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updatePassword: jest.fn(),
      deleteAccountData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('forces public registration role to patient', async () => {
    usersService.findOneByPhoneNumber.mockResolvedValue(null);
    usersService.create.mockImplementation(async (input) => ({
      id: 'user-1',
      ...input,
    }));

    await service.register({
      phoneNumber: '01012345678',
      password: 'abc12345',
      name: '홍길동',
      birthDate: '1970-01-01',
      gender: 'male' as any,
      role: 'doctor' as any,
      privacyPolicyAgreed: true,
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'patient' }),
    );
  });

  it('changes a password only after the current password is verified', async () => {
    const password = await bcrypt.hash('before123', 4);
    usersService.findById.mockResolvedValue({ id: 'user-1', password });

    await service.changePassword('user-1', 'before123', 'after123');

    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
    );
  });

  it('deletes an account only after the current password is verified', async () => {
    const password = await bcrypt.hash('before123', 4);
    usersService.findById.mockResolvedValue({ id: 'user-1', password });

    await service.deleteAccount('user-1', 'before123');

    expect(usersService.deleteAccountData).toHaveBeenCalledWith('user-1');
  });
});
