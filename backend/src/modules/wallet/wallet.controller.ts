import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { OmiseWalletService } from './omise-wallet.service';
import {
  TopupWalletDto,
  WalletTransactionQueryDto,
  CreateOmiseWalletTopupDto,
} from './dto/wallet.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly omiseWalletService: OmiseWalletService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  getBalance(@CurrentUser() user: RequestUser) {
    return this.walletService.getBalance(user.id);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Top up wallet balance' })
  topup(@CurrentUser() user: RequestUser, @Body() dto: TopupWalletDto) {
    return this.walletService.topup(user.id, dto);
  }

  @Post('omise/charges')
  @ApiOperation({
    summary: 'Create Omise charge for wallet top-up (credit after webhook confirms)',
    description:
      'Send `card` (token from Omise.js) or `source` (e.g. PromptPay). Does not credit wallet until webhook marks success.',
  })
  createOmiseTopupCharge(@CurrentUser() user: RequestUser, @Body() dto: CreateOmiseWalletTopupDto) {
    return this.omiseWalletService.createTopupCharge(user.id, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  getTransactions(@CurrentUser() user: RequestUser, @Query() query: WalletTransactionQueryDto) {
    return this.walletService.getTransactions(user.id, query);
  }
}
