import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController, AdminNewsController } from './news.controller';

@Module({
  controllers: [NewsController, AdminNewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
