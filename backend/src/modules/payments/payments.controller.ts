import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get my payment history' })
  getMyPayments(@CurrentUser() user: RequestUser, @Query() query: any) {
    return this.paymentsService.getMyPayments(user.id, query);
  }

  @Post('webhook/:gatewayRef')
  @ApiOperation({ summary: 'Handle payment webhook (no auth - verified internally)' })
  handleWebhook(@Param('gatewayRef') gatewayRef: string, @Body() body: Record<string, any>) {
    return this.paymentsService.handleWebhook(gatewayRef, body);
  }

  // ── Admin endpoints ──────────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all payments (Admin)' })
  findAll(@Query() query: any) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payment detail (Admin)' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
