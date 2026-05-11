import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Request,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('check-phone')
  @ApiOperation({ summary: '휴대폰 번호 가입 가능 여부 (인증 불필요)' })
  async checkPhone(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber || !/^010\d{8}$/.test(phoneNumber)) {
      return { available: false, validFormat: false };
    }
    const available = await this.authService.isPhoneNumberAvailable(phoneNumber);
    return { available, validFormat: true };
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인 (JWT 발급)' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.phoneNumber, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT')
  @Get('profile')
  @ApiOperation({ summary: '내 프로필 (JWT 필요)' })
  getProfile(@Request() req: { user: User }) {
    return this.mapPublicProfile(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT')
  @Patch('profile')
  @ApiOperation({ summary: '내 프로필 수정 (JWT 필요)' })
  async patchProfile(
    @Request() req: { user: User },
    @Body() dto: UpdateProfileDto,
  ) {
    const u = await this.usersService.updateProfile(req.user.id, dto);
    return this.mapPublicProfile(u);
  }

  private mapPublicProfile(u: User) {
    return {
      id: u.id,
      phoneNumber: u.phoneNumber,
      name: u.name,
      birthDate: u.birthDate,
      gender: u.gender,
      role: u.role,
      createdAt: u.createdAt,
    };
  }
}
