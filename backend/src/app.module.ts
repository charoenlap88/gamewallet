import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AdminNavRoleModule } from './modules/admin-nav-role/admin-nav-role.module';
import { AgentsModule } from './modules/agents/agents.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { NewsModule } from './modules/news/news.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletModule,
    ProductsModule,
    SuppliersModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    AuditLogModule,
    AdminNavRoleModule,
    AgentsModule,
    CurrencyModule,
    NewsModule,
  ],
})
export class AppModule {}
