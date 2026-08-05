import {
  IsString,
  IsEnum,
  Matches,
  MinLength,
  IsDateString,
  IsOptional,
  IsBoolean,
  Equals,
} from 'class-validator';
import { Gender, UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  @Matches(/^010\d{8}$/, {
    message:
      'Phone number must be a valid Korean mobile number (e.g., 01012345678)',
  })
  phoneNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: 'Password must contain both letters and numbers',
  })
  password: string;

  @IsString()
  name: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Equals(true, { message: '개인정보처리방침에 동의해야 합니다.' })
  privacyPolicyAgreed?: boolean;
}

export class LoginDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '이름을 입력해 주세요.' })
  name?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: 'Password must contain both letters and numbers',
  })
  newPassword: string;
}

export class DeleteAccountDto {
  @IsString()
  password: string;

  @IsString()
  @Equals('탈퇴', { message: '탈퇴 확인 문구를 정확히 입력해 주세요.' })
  confirmation: string;
}
