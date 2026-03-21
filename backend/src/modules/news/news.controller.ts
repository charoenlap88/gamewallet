import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { NewsService } from './news.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Published news list (public)' })
  listPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.listPublic({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Single published article by slug (public)' })
  getPublic(@Param('slug') slug: string) {
    return this.newsService.getPublicBySlug(slug);
  }
}

@ApiTags('Admin — News')
@Controller('admin/news')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'All news (admin)' })
  adminList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.adminList({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create news' })
  create(@Body() dto: CreateNewsDto) {
    return this.newsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update news' })
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.newsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete news' })
  remove(@Param('id') id: string) {
    return this.newsService.adminDelete(id);
  }
}
