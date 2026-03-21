import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderQueryDto, AdminSetOrderStatusDto } from './dto/order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user';
import { clientIp, clientUserAgent } from '../../common/utils/request.util';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my orders' })
  getMyOrders(@CurrentUser() user: RequestUser, @Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query, user.id, false);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get my order detail' })
  getMyOrder(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch('my/:id/cancel')
  @ApiOperation({ summary: 'Cancel my order' })
  cancelMyOrder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.ordersService.cancelOrder(id, user.id, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  // ── Admin endpoints ──────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all orders (Admin)' })
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query, undefined, true);
  }

  @Get('dashboard/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get order dashboard stats (Admin)' })
  getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get order by ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/mark-processing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark order as PROCESSING (Admin manual queue)' })
  markProcessing(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.ordersService.manualMarkProcessing(id, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Patch(':id/mark-complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually complete order as SUCCESS (Admin)' })
  markComplete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.ordersService.manualMarkComplete(id, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Patch(':id/admin-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set order status (Admin board / manual)' })
  adminSetStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AdminSetOrderStatusDto,
    @Req() req: Request,
  ) {
    return this.ordersService.adminApplyStatus(id, dto.status, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel order (Admin)' })
  cancelOrder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.ordersService.cancelOrder(id, undefined, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Patch('items/:itemId/retry')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Retry failed order item (Admin)' })
  retryItem(@CurrentUser() user: RequestUser, @Param('itemId') itemId: string, @Req() req: Request) {
    return this.ordersService.retryItem(itemId, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }
}
