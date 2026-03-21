import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopupWalletDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'Topup via PromptPay' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}

export class WalletTransactionQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number;
}

/** เติมเงินผ่าน Omise — ต้องส่ง `card` (token จาก Omise.js) หรือ `source` (เช่น พร้อมเพย์) อย่างใดอย่างหนึ่ง */
export class CreateOmiseWalletTopupDto {
  @ApiProperty({ example: 100, description: 'จำนวนเงิน (บาท)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500000)
  amount: number;

  @ApiPropertyOptional({ description: 'Card token จาก Omise.js (tokn_...)' })
  @IsOptional()
  @IsString()
  card?: string;

  @ApiPropertyOptional({ description: 'Omise Source id (เช่น พร้อมเพย์ — src_...)' })
  @IsOptional()
  @IsString()
  source?: string;
}
