import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        // Connect to database when module initializes
        await this.$connect();
        console.log('Database connected');
    }

    async onModuleDestroy() {
        // Disconnect when module is destroyed
        await this.$disconnect();
        console.log('Database disconnected');
    }
}
