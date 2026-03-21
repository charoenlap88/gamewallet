import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletTopupStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const OMISE_API = 'https://api.omise.co';
const OMISE_VERSION = '2019-05-29';

/** จำกัดยอดเติมต่อครั้ง (บาท) */
const MIN_THB = 1;
const MAX_THB = 500_000;

@Injectable()
export class OmiseWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getSecretKey(): string {
    const key = this.config.get<string>('OMISE_SECRET_KEY') || process.env.OMISE_SECRET_KEY;
    if (!key?.trim()) {
      throw new ServiceUnavailableException(
        'Omise is not configured (set OMISE_SECRET_KEY in environment)',
      );
    }
    return key.trim();
  }

  /**
   * สร้าง Omise Charge สำหรับเติมเงินเข้า wallet
   * - ใช้ `card` = token จาก Omise.js หรือ `source` = source id (เช่น พร้อมเพย์)
   * - ยังไม่เพิ่มยอด wallet — รอ webhook ยืนยัน charge สำเร็จ
   */
  async createTopupCharge(
    userId: string,
    dto: { amount: number; card?: string; source?: string },
  ) {
    if (!dto.card?.trim() && !dto.source?.trim()) {
      throw new BadRequestException('Provide either `card` (token from Omise.js) or `source` (source id)');
    }

    const amountThb = Number(dto.amount);
    if (!Number.isFinite(amountThb) || amountThb < MIN_THB || amountThb > MAX_THB) {
      throw new BadRequestException(`Amount must be between ${MIN_THB} and ${MAX_THB} THB`);
    }

    const amountSatang = Math.round(amountThb * 100);
    if (amountSatang < 100) {
      throw new BadRequestException('Minimum top-up is 1.00 THB');
    }

    const topup = await this.prisma.walletTopup.create({
      data: {
        userId,
        amount: amountThb,
        amountSatang,
        currency: 'thb',
        status: WalletTopupStatus.PENDING,
      },
    });

    const body: Record<string, unknown> = {
      amount: amountSatang,
      currency: 'thb',
      metadata: {
        wallet_topup_id: topup.id,
        purpose: 'wallet_topup',
      },
    };
    if (dto.card?.trim()) body.card = dto.card.trim();
    if (dto.source?.trim()) body.source = dto.source.trim();

    try {
      const charge = await this.omisePost<{ [k: string]: unknown }>('/charges', body);
      const chargeId = String(charge.id ?? '');
      const status = String(charge.status ?? '');
      const failed = status === 'failed';

      await this.prisma.walletTopup.update({
        where: { id: topup.id },
        data: {
          omiseChargeId: chargeId || null,
          omiseCharge: charge as object,
          status: failed ? WalletTopupStatus.FAILED : WalletTopupStatus.PENDING,
          omiseFailure: failed ? (charge as object) : undefined,
        },
      });

      return {
        topupId: topup.id,
        charge: this.sanitizeCharge(charge),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Omise request failed';
      await this.prisma.walletTopup.update({
        where: { id: topup.id },
        data: {
          status: WalletTopupStatus.FAILED,
          omiseFailure: { message: msg },
        },
      });
      throw err;
    }
  }

  private async omisePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const secret = this.getSecretKey();
    const auth = Buffer.from(`${secret}:`).toString('base64');

    const res = await fetch(`${OMISE_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Omise-Version': OMISE_VERSION,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as T & { message?: string; object?: string };

    if (!res.ok) {
      const message =
        typeof data?.message === 'string'
          ? data.message
          : `Omise API error (${res.status})`;
      throw new BadRequestException(message);
    }

    if ((data as { object?: string }).object === 'error') {
      throw new BadRequestException(
        String((data as { message?: string }).message || 'Omise error'),
      );
    }

    return data as T;
  }

  private sanitizeCharge(charge: { [k: string]: unknown }) {
    return {
      id: charge.id,
      object: charge.object,
      status: charge.status,
      amount: charge.amount,
      currency: charge.currency,
      paid: charge.paid,
      paid_at: charge.paid_at,
      authorize_uri: charge.authorize_uri,
      return_uri: charge.return_uri,
      failure_code: charge.failure_code,
      failure_message: charge.failure_message,
      created_at: charge.created_at,
    };
  }

  /** สำหรับ webhook: ค้นหาจาก Omise charge id */
  findTopupByChargeId(chargeId: string) {
    return this.prisma.walletTopup.findUnique({ where: { omiseChargeId: chargeId } });
  }
}
