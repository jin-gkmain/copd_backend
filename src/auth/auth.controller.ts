import { Controller, Post, Body, UseGuards, Get, Request, UnauthorizedException, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  getProfile(@Request() req: any) {
    return req.user;
  }
}
