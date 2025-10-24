import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ClerkStrategy } from './clerk.strategy';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkClientProvider } from '../providers/clerk-client.provider';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    PrismaModule, // ✅ Import PrismaModule for database access
  ],
  providers: [
    ClerkStrategy,
    ClerkAuthGuard,
    ClerkClientProvider, // ✅ Provide ClerkClient for API calls
  ],
  exports: [ClerkAuthGuard],
})
export class AuthModule {}
