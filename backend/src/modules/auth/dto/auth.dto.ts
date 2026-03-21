import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '0812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'GW-A1', description: 'รหัสแนะนำจากตัวแทนขาย' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{2,32}$/)
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (credential) from Google Identity Services' })
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ example: 'GW-A1', description: 'รหัสแนะนำจากตัวแทนขาย (ตอนสมัคร)' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class Complete2faDto {
  @ApiProperty()
  @IsString()
  pendingToken: string;

  @ApiProperty({ description: 'TOTP จากแอป / รหัส 6 หลักจากอีเมล' })
  @IsString()
  code: string;
}

export class TotpEnableDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class EmailEnableRequestDto {
  @ApiProperty()
  @IsString()
  password: string;
}

export class EmailEnableConfirmDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class Disable2faDto {
  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'TOTP หรือรหัสจากอีเมล (ตามวิธีที่เปิดอยู่)' })
  @IsString()
  code: string;
}
