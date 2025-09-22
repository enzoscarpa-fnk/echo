import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConversationsService } from '../services/conversations.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createConversationDto: CreateConversationDto,
  ) {
    return await this.conversationsService.create(createConversationDto);
  }

  @Get()
  async findByUser(
    @Query('userId', ParseUUIDPipe) userId: string, // Temporaire, sera remplacé par l'auth
  ) {
    return await this.conversationsService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.conversationsService.findOne(id);
  }
}
