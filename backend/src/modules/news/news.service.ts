import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(title: string): string {
    const base = title
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0E00-\u0E7F]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96);
    return base || 'news';
  }

  private async uniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = this.slugify(title);
    let n = 0;
    while (true) {
      const candidate = n === 0 ? slug : `${slug}-${n}`;
      const existing = await this.prisma.newsArticle.findFirst({
        where: excludeId
          ? { slug: candidate, NOT: { id: excludeId } }
          : { slug: candidate },
      });
      if (!existing) return candidate;
      n += 1;
    }
  }

  async listPublic(params?: { page?: number; limit?: number }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 20));
    const where = { isPublished: true as const };
    const [total, data] = await Promise.all([
      this.prisma.newsArticle.count({ where }),
      this.prisma.newsArticle.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          pinned: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);
    return { data, total, page, limit };
  }

  async getPublicBySlug(slug: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: { slug, isPublished: true },
    });
    if (!article) throw new NotFoundException('News not found');
    return article;
  }

  async adminList(params?: { page?: number; limit?: number }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 50));
    const [total, data] = await Promise.all([
      this.prisma.newsArticle.count(),
      this.prisma.newsArticle.findMany({
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data, total, page, limit };
  }

  async adminCreate(dto: CreateNewsDto) {
    const slug = await this.uniqueSlug(dto.title);
    const publishedAt = dto.isPublished ? new Date() : null;
    return this.prisma.newsArticle.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt ?? null,
        body: dto.body,
        isPublished: dto.isPublished ?? false,
        pinned: dto.pinned ?? false,
        publishedAt,
      },
    });
  }

  async adminUpdate(id: string, dto: UpdateNewsDto) {
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('News not found');

    let slug = existing.slug;
    if (dto.title && dto.title !== existing.title) {
      slug = await this.uniqueSlug(dto.title, id);
    }

    let publishedAt = existing.publishedAt;
    if (dto.isPublished === true && !existing.isPublished) {
      publishedAt = new Date();
    }
    if (dto.isPublished === false) {
      publishedAt = null;
    }

    return this.prisma.newsArticle.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        slug,
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.coverImageUrl !== undefined && {
          coverImageUrl: dto.coverImageUrl?.trim() || null,
        }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
        publishedAt,
      },
    });
  }

  async adminDelete(id: string) {
    await this.prisma.newsArticle.delete({ where: { id } });
    return { ok: true };
  }
}
