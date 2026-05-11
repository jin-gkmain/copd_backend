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
}
