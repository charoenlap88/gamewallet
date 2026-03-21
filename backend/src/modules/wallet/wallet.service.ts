import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TopupWalletDto, WalletTransactionQueryDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { balance: wallet.balance, walletId: wallet.id };
  }

  async topup(userId: string, dto: TopupWalletDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + dto.amount;

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: WalletTransactionType.TOPUP,
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          status: WalletTransactionStatus.SUCCESS,
          description: dto.description || 'Wallet top-up',
          reference: dto.reference,
        },
      }),
    ]);

    return {
      balance: updatedWallet.balance,
      transaction,
    };
  }

  async getTransactions(userId: string, query: WalletTransactionQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return { data, total, page, limit };
  }

  async deductBalance(userId: string, amount: number, description: string, reference?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const balanceBefore = Number(wallet.balance);
    if (balanceBefore < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const balanceAfter = balanceBefore - amount;

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: WalletTransactionType.PURCHASE,
          amount,
          balanceBefore,
          balanceAfter,
          status: WalletTransactionStatus.SUCCESS,
          description,
          reference,
        },
      }),
    ]);

    return { balance: updatedWallet.balance, transaction };
  }
}
