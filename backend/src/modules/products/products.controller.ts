import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { clientIp, clientUserAgent } from '../../common/utils/request.util';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public endpoints ─────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories (public)' })
  getCategories() {
    return this.productsService.findAllCategories();
  }

  @Get()
  @ApiOperation({ summary: 'Get active products (public)' })
  findPublic(@Query() query: ProductQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail (public)' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ── Admin endpoints ──────────────────────────────────────────────

  @Post('categories')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (Admin)' })
  createCategory(@CurrentUser() user: RequestUser, @Body() dto: CreateProductCategoryDto, @Req() req: Request) {
    return this.productsService.createCategory(dto, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Patch('categories/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin)' })
  updateCategory(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
    @Req() req: Request,
  ) {
    return this.productsService.updateCategory(id, dto, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (Admin)' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto, @Req() req: Request) {
    return this.productsService.create(dto, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin)' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: Request,
  ) {
    return this.productsService.update(id, dto, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate product (Admin)' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.productsService.remove(id, {
      actorId: user.id,
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }
}
