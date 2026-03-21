import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateApiKeyDto,
  UpdateApiKeyStatusDto,
  CreateResponseMappingDto,
  CreateSupplierProductDto,
} from './dto/supplier.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List all suppliers' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier detail' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create supplier' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  // ── API Keys ──────────────────────────────────────────────────────

  @Post(':id/api-keys')
  @ApiOperation({ summary: 'Add API key to supplier' })
  addApiKey(@Param('id') id: string, @Body() dto: CreateApiKeyDto, @Request() req: any) {
    return this.suppliersService.addApiKey(id, dto, req.user?.id);
  }

  @Patch('api-keys/:keyId/status')
  @ApiOperation({ summary: 'Update API key status' })
  updateApiKeyStatus(@Param('keyId') keyId: string, @Body() dto: UpdateApiKeyStatusDto) {
    return this.suppliersService.updateApiKeyStatus(keyId, dto);
  }

  @Delete('api-keys/:keyId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete API key' })
  deleteApiKey(@Param('keyId') keyId: string) {
    return this.suppliersService.deleteApiKey(keyId);
  }

  // ── Response Mappings ─────────────────────────────────────────────

  @Post(':id/mappings')
  @ApiOperation({ summary: 'Add response mapping to supplier' })
  addMapping(@Param('id') id: string, @Body() dto: CreateResponseMappingDto) {
    return this.suppliersService.addResponseMapping(id, dto);
  }

  @Patch('mappings/:mappingId')
  @ApiOperation({ summary: 'Update response mapping' })
  updateMapping(@Param('mappingId') mappingId: string, @Body() dto: Partial<CreateResponseMappingDto>) {
    return this.suppliersService.updateResponseMapping(mappingId, dto);
  }

  @Delete('mappings/:mappingId')
  @ApiOperation({ summary: 'Delete response mapping' })
  deleteMapping(@Param('mappingId') mappingId: string) {
    return this.suppliersService.deleteResponseMapping(mappingId);
  }

  // ── Supplier Products ─────────────────────────────────────────────

  @Post(':id/products')
  @ApiOperation({ summary: 'Link product to supplier with cost price' })
  addProduct(@Param('id') id: string, @Body() dto: CreateSupplierProductDto) {
    return this.suppliersService.addProduct(id, dto);
  }

  @Get(':id/cheapest/:productId')
  @ApiOperation({ summary: 'Get cheapest supplier for product' })
  getCheapest(@Param('productId') productId: string) {
    return this.suppliersService.getCheapestSupplier(productId);
  }
}
