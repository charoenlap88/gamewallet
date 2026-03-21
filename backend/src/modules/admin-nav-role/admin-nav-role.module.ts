import { Module } from '@nestjs/common';
import { AdminNavRoleService } from './admin-nav-role.service';
import { AdminNavRoleController } from './admin-nav-role.controller';

@Module({
  controllers: [AdminNavRoleController],
  providers: [AdminNavRoleService],
  exports: [AdminNavRoleService],
})
export class AdminNavRoleModule {}
