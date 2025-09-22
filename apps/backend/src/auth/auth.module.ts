// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ClerkStrategy } from './clerk.strategy';
import { PassportModule } from '@nestjs/passport';
import { ClerkClientProvider } from '../providers/clerk-client.provider';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [PassportModule, ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [ClerkStrategy, ClerkClientProvider],
  exports: [PassportModule, TypeOrmModule],
})
export class AuthModule {}
