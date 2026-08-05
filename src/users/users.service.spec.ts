import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    manager: { transaction: jest.Mock };
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      manager: { transaction: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('removes related records before removing the account', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'user-1' }]);
    repository.manager.transaction.mockImplementation(async (callback) =>
      callback({ query }),
    );

    await service.deleteAccountData('user-1');

    expect(query).toHaveBeenCalledTimes(7);
    expect(query.mock.calls[0][0]).toContain('breathing_data');
    expect(query.mock.calls[6][0]).toContain('DELETE FROM "users"');
  });
});
