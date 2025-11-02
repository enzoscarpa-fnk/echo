import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ClerkStrategy } from './clerk.strategy';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkClientProvider } from './clerk-client.provider';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'clerk' }),
        ConfigModule,
        PrismaModule,
    ],
    providers: [ClerkStrategy, ClerkAuthGuard, ClerkClientProvider],
    exports: [ClerkAuthGuard, PassportModule],
})
export class AuthModule {}
