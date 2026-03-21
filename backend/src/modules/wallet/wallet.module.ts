import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { OmiseWalletService } from './omise-wallet.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, OmiseWalletService],
  exports: [WalletService, OmiseWalletService],
})
export class WalletModule {}
