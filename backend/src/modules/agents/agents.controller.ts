import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AgentsService } from './agents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agents')
export class AgentsController {
  constructor(private readonly svc: AgentsService) {}

  @Get('me/summary')
  @ApiOperation({ summary: 'สรุปภาพรวมตัวแทนขาย' })
  summary(@CurrentUser() user: RequestUser) {
    return this.svc.getMySummary(user.id, user.role);
  }

  @Get('me/customers')
  @ApiOperation({ summary: 'ลูกค้าที่สมัครผ่านรหัสตัวแทน' })
  customers(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getMyCustomers(user.id, user.role, Number(page) || 1, Number(limit) || 20);
  }
}
