import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/auth.dto';

export type PublicUser = Omit<User, 'password'>;
export const currentPrivacyPolicyVersion = '2026-08-03';

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

    const { privacyPolicyAgreed: _, ...profile } = registerDto;
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersService.create({
      ...profile,
      role: UserRole.PATIENT,
      password: hashedPassword,
      privacyPolicyVersion: currentPrivacyPolicyVersion,
      privacyPolicyAgreedAt: new Date(),
    });

    return this.toPublicUser(newUser);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }
    await this.usersService.deleteAccountData(user.id);
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
      privacyPolicyVersion: user.privacyPolicyVersion,
      privacyPolicyAgreedAt: user.privacyPolicyAgreedAt,
    };
  }
}
