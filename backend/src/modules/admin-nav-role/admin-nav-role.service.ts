import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeMenuKeys } from '../../common/constants/admin-menu-keys';
import { CreateAdminNavRoleDto, UpdateAdminNavRoleDto } from './dto/admin-nav-role.dto';

@Injectable()
export class AdminNavRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.adminNavRole.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const r = await this.prisma.adminNavRole.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Role not found');
    return r;
  }

  async create(dto: CreateAdminNavRoleDto) {
    const slug = dto.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const exists = await this.prisma.adminNavRole.findUnique({ where: { slug } });
    if (exists) throw new ConflictException('Slug already exists');
    const menuKeys = sanitizeMenuKeys(dto.menuKeys);
    if (menuKeys.length === 0) throw new BadRequestException('ต้องเลือกอย่างน้อย 1 เมนู');
    return this.prisma.adminNavRole.create({
      data: {
        slug,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        menuKeys,
        isSystem: false,
      },
    });
  }

  async update(id: string, dto: UpdateAdminNavRoleDto) {
    const existing = await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name != null) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim();
    if (dto.menuKeys) {
      const menuKeys = sanitizeMenuKeys(dto.menuKeys);
      if (menuKeys.length === 0) throw new BadRequestException('ต้องเลือกอย่างน้อย 1 เมนู');
      data.menuKeys = menuKeys;
    }
    return this.prisma.adminNavRole.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.isSystem) throw new BadRequestException('ลบ role ระบบไม่ได้');
    const inUse = await this.prisma.user.count({ where: { navRoleId: id } });
    if (inUse > 0) throw new BadRequestException('ยังมีผู้ใช้ผูก role นี้อยู่');
    await this.prisma.adminNavRole.delete({ where: { id } });
    return { ok: true };
  }
}
