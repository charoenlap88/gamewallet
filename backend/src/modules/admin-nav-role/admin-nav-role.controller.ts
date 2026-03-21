import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AdminNavRoleService } from './admin-nav-role.service';
import { CreateAdminNavRoleDto, UpdateAdminNavRoleDto } from './dto/admin-nav-role.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Admin Nav Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin-nav-roles')
export class AdminNavRoleController {
  constructor(private readonly svc: AdminNavRoleService) {}

  @Get()
  @ApiOperation({ summary: 'List admin nav roles (Super Admin)' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create nav role' })
  create(@Body() dto: CreateAdminNavRoleDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update nav role' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminNavRoleDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete nav role' })
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
