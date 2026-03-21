import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @ApiOperation({
    summary:
      'FX rates with THB as base (Frankfurter / ECB, cached ~1h on server)',
  })
  getRates() {
    return this.currencyService.getRates();
  }
}
