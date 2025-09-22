import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(
    @Body() createMessageDto: CreateMessageDto, // ← Retire ValidationPipe temporairement
  ): Promise<any> {
    console.log('POST /messages - Received:', createMessageDto); // ← Ajoute ce log
    return await this.messagesService.create(createMessageDto);
  }

  @Get()
  async findByConversation(
    @Query('conversationId') conversationId: string, // ← Retire ParseUUIDPipe temporairement
  ): Promise<any[]> {
    console.log('GET /messages - conversationId:', conversationId); // ← Ajoute ce log

    if (!conversationId) {
      return []; // Retourne liste vide si pas de conversationId
    }

    return await this.messagesService.findAllByConversation(conversationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> { // ← Retire ParseUUIDPipe temporairement
    return await this.messagesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, // ← Retire ParseUUIDPipe temporairement
    @Body() updateMessageDto: UpdateMessageDto, // ← Retire ValidationPipe temporairement
    @Query('userId') userId: string, // ← Retire ParseUUIDPipe temporairement
  ): Promise<any> {
    return await this.messagesService.update(id, updateMessageDto, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string, // ← Retire ParseUUIDPipe temporairement
    @Query('userId') userId: string, // ← Retire ParseUUIDPipe temporairement
  ): Promise<{ message: string }> {
    await this.messagesService.remove(id, userId);
    return { message: 'Message deleted successfully' };
  }
}
