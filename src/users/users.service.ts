import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phoneNumber } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateProfile(
    id: string,
    patch: { name?: string; birthDate?: string; gender?: User['gender'] },
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (patch.name !== undefined) {
      user.name = patch.name;
    }
    if (patch.birthDate !== undefined) {
      user.birthDate = patch.birthDate;
    }
    if (patch.gender !== undefined) {
      user.gender = patch.gender;
    }
    return this.usersRepository.save(user);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const result = await this.usersRepository.update(id, {
      password: passwordHash,
    });
    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
  }

  async deleteAccountData(id: string): Promise<void> {
    await this.usersRepository.manager.transaction(async (manager) => {
      // Some legacy foreign keys do not cascade. Delete every user-owned
      // record explicitly before removing the account.
      for (const table of [
        'breathing_data',
        'assessments',
        'six_minute_step_assessments',
        'daily_morning_reports',
        'medical_surveys',
        'clinical_profiles',
      ]) {
        await manager.query(`DELETE FROM "${table}" WHERE "userId" = $1`, [id]);
      }
      const deleted = await manager.query(
        'DELETE FROM "users" WHERE "id" = $1 RETURNING "id"',
        [id],
      );
      if (!Array.isArray(deleted) || deleted.length === 0) {
        throw new NotFoundException('User not found');
      }
    });
  }
}
