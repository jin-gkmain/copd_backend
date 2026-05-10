import { IsString, IsPhoneNumber, IsEnum, Matches, MinLength, IsDateString } from 'class-validator';
import { Gender, UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  @Matches(/^010\d{8}$/, { message: 'Phone number must be a valid Korean mobile number (e.g., 01012345678)' })
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
  role: UserRole;
}

export class LoginDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  password: string;
}
