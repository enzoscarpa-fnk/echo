import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

    @Get('/api/health')
    getHealth() {
        return {
            status: 'ok',
            message: 'Echo backend is running!',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }
}
