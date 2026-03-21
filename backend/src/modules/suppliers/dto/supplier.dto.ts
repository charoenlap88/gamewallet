import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsPositive,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierStatus, ApiKeyEnvironment, ApiKeyStatus } from '@prisma/client';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Supplier A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SUPPLIER_A' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://api.supplier-a.com' })
  @IsString()
  baseUrl: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Authorization' })
  @IsString()
  keyName: string;

  @ApiProperty({ example: 'Bearer token123' })
  @IsString()
  keyValue: string;

  @ApiPropertyOptional({ enum: ApiKeyEnvironment })
  @IsOptional()
  @IsEnum(ApiKeyEnvironment)
  environment?: ApiKeyEnvironment;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateApiKeyStatusDto {
  @ApiProperty({ enum: ApiKeyStatus })
  @IsEnum(ApiKeyStatus)
  status: ApiKeyStatus;
}

export class CreateResponseMappingDto {
  @ApiProperty({ example: 'status' })
  @IsString()
  fieldName: string;

  @ApiProperty({ example: 'result_code' })
  @IsString()
  supplierField: string;

  @ApiProperty({ example: 'orderStatus' })
  @IsString()
  systemField: string;

  @ApiPropertyOptional({ example: { done: 'SUCCESS', processing: 'PENDING', failed: 'FAILED' } })
  @IsOptional()
  valueMapping?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSupplierProductDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'MLBB-100' })
  @IsString()
  supplierSku: string;

  @ApiProperty({ example: 45.00 })
  @IsNumber()
  @IsPositive()
  costPrice: number;
}
