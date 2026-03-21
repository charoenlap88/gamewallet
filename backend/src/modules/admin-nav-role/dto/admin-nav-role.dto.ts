import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminNavRoleDto {
  @ApiProperty({ example: 'support-team' })
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiProperty({ example: 'ทีมซัพพอร์ต' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], example: ['dashboard', 'orders'] })
  @IsArray()
  @IsString({ each: true })
  menuKeys!: string[];
}

export class UpdateAdminNavRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menuKeys?: string[];
}
