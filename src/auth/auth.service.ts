import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phoneNumber: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
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

  async register(registerDto: RegisterDto) {
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

    const { password, ...result } = newUser;
    return result;
  }
}
