import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../database/prisma.module';
import { PusherProvider } from './pusher.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [UsersController],
    providers: [UsersService, PusherProvider],
    exports: [UsersService, PusherProvider],
})
export class UsersModule {}
