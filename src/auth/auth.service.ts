import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/auth.dto';

export type PublicUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    phoneNumber: string,
    pass: string,
  ): Promise<PublicUser | null> {
    const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (user && (await bcrypt.compare(pass, user.password))) {
      return this.toPublicUser(user);
    }
    return null;
  }

  login(user: PublicUser) {
    const payload = {
      phoneNumber: user.phoneNumber,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
      },
    };
  }

  async isPhoneNumberAvailable(phoneNumber: string): Promise<boolean> {
    const existing = await this.usersService.findOneByPhoneNumber(phoneNumber);
    return !existing;
  }

  async register(registerDto: RegisterDto): Promise<PublicUser> {
    const existingUser = await this.usersService.findOneByPhoneNumber(
      registerDto.phoneNumber,
    );
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersService.create({
      ...registerDto,
      role: UserRole.PATIENT,
      password: hashedPassword,
    });

    return this.toPublicUser(newUser);
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      birthDate: user.birthDate,
      gender: user.gender,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
