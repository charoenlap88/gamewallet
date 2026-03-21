import { Injectable } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  hashCode(code: string): string {
    return createHash('sha256').update(code.trim()).digest('hex');
  }

  /** สร้าง OTP 6 หลัก เก็บ hash — คืนค่า plain code สำหรับส่งอีเมล */
  async createEmailOtp(userId: string, purpose: string): Promise<string> {
    const code = String(randomInt(100000, 999999));
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.emailOtpChallenge.deleteMany({
      where: { userId, purpose, consumed: false },
    });
    await this.prisma.emailOtpChallenge.create({
      data: { userId, codeHash, expiresAt, purpose },
    });
    return code;
  }

  async verifyEmailOtp(
    userId: string,
    code: string,
    purpose: string,
  ): Promise<boolean> {
    const challenge = await this.prisma.emailOtpChallenge.findFirst({
      where: {
        userId,
        purpose,
        consumed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) return false;
    const ok = challenge.codeHash === this.hashCode(code);
    if (ok) {
      await this.prisma.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: { consumed: true },
      });
    }
    return ok;
  }
}
